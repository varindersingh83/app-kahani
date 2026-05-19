export type PrivateAsset = {
  id: string;
  ownerUserId: string;
  contentType: string;
  assetKind: "page_image" | "cover_image" | "book_html" | "story_json";
  body: Buffer;
  deleted: boolean;
  createdAt: string;
};

export type PrivateAssetStore = {
  save(input: {
    ownerUserId: string;
    contentType: string;
    assetKind: PrivateAsset["assetKind"];
    body: Buffer | string;
  }): Promise<PrivateAsset>;
  readForOwner(input: {
    assetId: string;
    ownerUserId: string;
  }): Promise<PrivateAsset | null>;
  readForShare(assetId: string): Promise<PrivateAsset | null>;
  deleteForOwner(input: {
    assetId: string;
    ownerUserId: string;
  }): Promise<boolean>;
};

export function createInMemoryPrivateAssetStore(): PrivateAssetStore {
  const assets = new Map<string, PrivateAsset>();

  return {
    async save(input) {
      const asset: PrivateAsset = {
        id: `asset_${assets.size + 1}`,
        ownerUserId: input.ownerUserId,
        contentType: input.contentType,
        assetKind: input.assetKind,
        body:
          typeof input.body === "string" ? Buffer.from(input.body) : input.body,
        deleted: false,
        createdAt: new Date().toISOString(),
      };
      assets.set(asset.id, asset);
      return asset;
    },
    async readForOwner(input) {
      const asset = assets.get(input.assetId);
      if (!asset || asset.deleted || asset.ownerUserId !== input.ownerUserId) {
        return null;
      }
      return asset;
    },
    async readForShare(assetId) {
      const asset = assets.get(assetId);
      if (!asset || asset.deleted) return null;
      return asset;
    },
    async deleteForOwner(input) {
      const asset = assets.get(input.assetId);
      if (!asset || asset.ownerUserId !== input.ownerUserId) return false;
      asset.deleted = true;
      return true;
    },
  };
}
