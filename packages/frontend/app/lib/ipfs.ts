import { PinataSDK } from "pinata";

interface PinataConfig {
  pinataJwt: string;
  pinataGateway: string;
  pinataGatewayToken: string;
}

const getPinataConfig = (): PinataConfig => {
  const pinataJwt = import.meta.env.VITE_PINATA_JWT;
  const pinataGateway = import.meta.env.VITE_PINATA_GATEWAY;
  const pinataGatewayToken = import.meta.env.VITE_PINATA_GATEWAY_TOKEN;

  if (!pinataJwt) {
    throw new Error("VITE_PINATA_JWT is not defined");
  }
  if (!pinataGateway) {
    throw new Error("VITE_PINATA_GATEWAY is not defined");
  }
  if (!pinataGatewayToken) {
    throw new Error("VITE_PINATA_GATEWAY_TOKEN is not defined");
  }

  return { pinataJwt, pinataGateway, pinataGatewayToken };
};

let ipfsClient: PinataSDK | null = null;

export const createIpfsClient = (): PinataSDK => {
  if (ipfsClient) return ipfsClient;

  const { pinataJwt, pinataGateway } = getPinataConfig();
  ipfsClient = new PinataSDK({ pinataJwt, pinataGateway });
  return ipfsClient;
};

export const ipfsUploadFile = async (file: File) => {
  const client = createIpfsClient();
  return client.upload.public.file(file);
};

export const ipfsUploadImageFile = async (imageFile: File) => {
  if (!imageFile?.type.startsWith("image/")) {
    throw new Error("Invalid or no image file selected");
  }
  return ipfsUploadFile(imageFile);
};

export const ipfs2https = (ipfsUri?: string): string | undefined => {
  if (!ipfsUri) return undefined;
  if (!ipfsUri.startsWith("ipfs://")) return ipfsUri;
  const { pinataGateway, pinataGatewayToken } = getPinataConfig();
  const cid = ipfsUri.replace("ipfs://", "");
  return `https://${pinataGateway}/ipfs/${cid}?pinataGatewayToken=${pinataGatewayToken}`;
};
