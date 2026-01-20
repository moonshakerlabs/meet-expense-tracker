import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { toast } from "sonner";

export interface ExportData {
  filename: string;
  content: string;
  mimeType: string;
}

const isNative = () => Capacitor.isNativePlatform();

export const exportFile = async (data: ExportData): Promise<boolean> => {
  if (isNative()) {
    return exportNative(data);
  } else {
    return exportWeb(data);
  }
};

const exportNative = async (data: ExportData): Promise<boolean> => {
  try {
    // Check if this is a binary file (PDF)
    const isPDF = data.mimeType === "application/pdf";
    
    // Write file to app's documents directory
    const result = await Filesystem.writeFile({
      path: data.filename,
      data: data.content,
      directory: Directory.Documents,
      encoding: isPDF ? undefined : Encoding.UTF8,
    });

    // Get the file URI for sharing
    const fileUri = result.uri;

    // Open share sheet so user can save to Downloads or share
    await Share.share({
      title: data.filename,
      url: fileUri,
      dialogTitle: "Save or Share Export",
    });

    return true;
  } catch (error) {
    console.error("Export error:", error);
    
    // Fallback: try to share as text if file export fails (only for non-binary)
    if (data.mimeType !== "application/pdf") {
      try {
        await Share.share({
          title: data.filename,
          text: data.content,
          dialogTitle: "Share Export",
        });
        return true;
      } catch (shareError) {
        console.error("Share fallback error:", shareError);
      }
    }
    toast.error("Export failed. Please try again.");
    return false;
  }
};

const exportWeb = async (data: ExportData): Promise<boolean> => {
  try {
    let blob: Blob;
    
    // Handle PDF (base64 encoded) vs text content
    if (data.mimeType === "application/pdf") {
      // Decode base64 to binary
      const binaryString = atob(data.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: data.mimeType });
    } else {
      blob = new Blob([data.content], { type: data.mimeType });
    }
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = data.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Web export error:", error);
    toast.error("Export failed");
    return false;
  }
};
