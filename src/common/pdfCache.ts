export type PdfEntry = {
  status: string;
  filepath: string;
};

export type PdfCollection = {
  [id: string]: PDFComponentGroup;
};
export type PDFComponentGroup = {
  components: PDFComponent[];
  status: string;
};
export type PDFComponent = {
  status: string;
  filepath: string;
  collectionId: string;
  componentId: string;
};

class PdfCache {
  private static instance: PdfCache;

  // Shape example
  // {
  //   '1101': {
  //     'status': "Generating",
  //     'components': [
  //       {
  //         'status': 'Generated',
  //         'filepath': '/tmp/home',
  //         'id': '1111',
  //         'parent': '1111',
  //       },
  //       {
  //         'status': 'Generating',
  //         'filepath': '/tmp/home',
  //         'id': "2222"
  //         'parent': "2222"
  //       },
  //     ]
  //   }
  // }
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
    if (!this.data[collectionId]) {
      this.data[collectionId] = { components: [], status: 'Generating' };
    }
    this.data[collectionId].components.push(status);
  }

  public getCollection(id: string): PDFComponentGroup {
    return this.data[id];
  }

  public deleteCollection(id: string) {
    delete this.data[id];
  }

  public isComplete(id: string): boolean {
    if (this.data[id].status === 'Generated') {
      return true;
    }
    return false;
  }
}

export default PdfCache;
