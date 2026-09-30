export async function downloadGraphImage(svgElement: SVGSVGElement, filename = 'webmap-er-graph.png'): Promise<void> {
  const xml = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const URL = window.URL || window.webkitURL || window;
  const blobURL = URL.createObjectURL(svgBlob);

  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 800;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#0b0f19';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const png = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = filename;
      a.href = png;
      a.click();
    }
    URL.revokeObjectURL(blobURL);
  };
  image.src = blobURL;
}

export function downloadGraphSvg(svgElement: SVGSVGElement, filename = 'webmap-er-graph.svg'): void {
  const xml = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  const URL = window.URL || window.webkitURL || window;
  const blobURL = URL.createObjectURL(svgBlob);
  const a = document.createElement('a');
  a.download = filename;
  a.href = blobURL;
  a.click();
  URL.revokeObjectURL(blobURL);
}
