export enum PdfStatus {
  Generating = 'Generating',
  Generated = 'Generated',
  Failed = 'Failed',
  NotFound = 'NotFound',
}

export type PdfEntry = {
  status: string;
  filepath: string;
};

export type PdfCollection = {
  [id: string]: PDFComponentGroup;
};
export type PDFComponentGroup = {
  components: PDFComponent[];
  status: PdfStatus;
  error?: string;
};
export type PDFComponent = {
  status: PdfStatus;
  filepath: string;
  collectionId: string;
  componentId: string;
  error?: string;
};

class PdfCache {
  private static instance: PdfCache;
  private data: PdfCollection;

  private constructor() {
    this.data = {};
  }

  public static getInstance(): PdfCache {
    if (!PdfCache.instance) {
      PdfCache.instance = new PdfCache();
    }
    return PdfCache.instance;
  }

  public addToCollection(collectionId: string, status: PDFComponent): void {
    const currentEntry = this.data[collectionId];
    if (!currentEntry) {
      this.data[collectionId] = {
        components: [],
        status: PdfStatus.Generating,
      };
    }
    // replace
    this.data[collectionId].components = this.data[
      collectionId
    ].components.filter(
      ({ componentId }) => componentId !== status.componentId
    );
    this.data[collectionId].components.push(status);
  }

  public getCollection(id: string): PDFComponentGroup {
    return this.data[id];
  }

  public deleteCollection(id: string) {
    delete this.data[id];
  }

  private updateCollectionState(
    collectionId: string,
    status: PdfStatus,
    error?: string
  ): void {
    if (!this.data[collectionId]) {
      throw new Error('Collection not found');
    }

    this.data[collectionId].components = this.data[collectionId].components.map(
      (component) => {
        return {
          ...component,
          status,
        };
      }
    );
    this.data[collectionId].status = status;
    this.data[collectionId].error = error;
  }

  public invalidateCollection(collectionId: string, error: string): void {
    this.updateCollectionState(collectionId, PdfStatus.Failed, error);
  }

  public verifyCollection(collectionId: string): void {
    this.updateCollectionState(collectionId, PdfStatus.Generated);
  }

  public isComplete(id: string): boolean {
    if (this.data[id].status === PdfStatus.Generated) {
      return true;
    }
    return false;
  }
}

export default PdfCache;
