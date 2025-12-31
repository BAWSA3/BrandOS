declare module 'colorthief' {
  type Color = [number, number, number];

  const ColorThief: {
    getColor(source: string, quality?: number): Promise<Color>;
    getPalette(source: string, colorCount?: number, quality?: number): Promise<Color[]>;
  };

  export default ColorThief;
}
