export class ProductNotFoundError {
  readonly _tag = 'ProductNotFoundError' as const;
  constructor(readonly message: string = 'Product not found') {}
}

export class CategoryNotFoundError {
  readonly _tag = 'CategoryNotFoundError' as const;
  constructor(readonly message: string = 'Category not found') {}
}

export class RepositoryError {
  readonly _tag = 'RepositoryError' as const;
  constructor(readonly message: string, readonly cause?: unknown) {}
}

export class AssetStorageError {
  readonly _tag = 'AssetStorageError' as const;
  constructor(readonly message: string, readonly cause?: unknown) {}
}

export class InvalidAssetTypeError {
  readonly _tag = 'InvalidAssetTypeError' as const;
  constructor(readonly message: string = 'Invalid asset type') {}
}

export class AssetUploadFailedError {
  readonly _tag = 'AssetUploadFailedError' as const;
  constructor(readonly message: string = 'Asset upload failed', readonly cause?: unknown) {}
}
