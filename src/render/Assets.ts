/** Prosty loader zasobów – punkt wejścia do podmiany placeholderów. */
export class Assets {
  private static images = new Map<string, HTMLImageElement>();

  static loadImage(name: string, url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { Assets.images.set(name, img); resolve(img); };
      img.onerror = () => reject(new Error(`Nie można wczytać obrazu: ${url}`));
      img.src = url;
    });
  }

  static image(name: string): HTMLImageElement | undefined {
    return Assets.images.get(name);
  }
}
