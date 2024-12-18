export interface Product {
  id: string;
  title: string;
  preview: string;
  price: number;
  fileType: 'tsx';
  fileSize: string;
  features: string[];
}

export const products: Product[] = [
  {
    id: '1',
    title: 'Floating Base Logos Animation',
    preview: 'A smooth, interactive animation component featuring floating Base logos with wave motion and screen wrapping.',
    price: 1.00,
    fileType: 'tsx',
    fileSize: '4.2KB',
    features: [
      'Smooth Wave Motion',
      'GPU Accelerated',
      'Screen Edge Wrapping',
      'Configurable Parameters',
      'React/Next.js Component'
    ]
  }
]; 