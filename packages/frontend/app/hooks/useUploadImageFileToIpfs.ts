import { useState } from "react";
import { ipfsUploadImageFile } from "~/lib/ipfs";

export interface UploadResult {
  ipfsCid: string;
  ipfsUri: string;
}

export const useUploadImageFileToIpfs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const uploadImageFileToIpfs = async (
    fileToUpload?: File,
  ): Promise<UploadResult | null> => {
    const fileToUse = fileToUpload ?? imageFile;
    if (!fileToUse) return null;

    setIsLoading(true);
    setError(null);

    try {
      const upload = await ipfsUploadImageFile(fileToUse);
      return { ipfsCid: upload.cid, ipfsUri: `ipfs://${upload.cid}` };
    } catch (err) {
      const e = err instanceof Error ? err : new Error("Upload failed");
      setError(e);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadImageFileToIpfs,
    imageFile,
    setImageFile,
    isLoading,
    error,
  };
};
