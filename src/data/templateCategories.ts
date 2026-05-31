export interface TemplateType {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  promptInstruction: string;
}

export const TEMPLATE_TYPES: TemplateType[] = [
  {
    id: "poster",
    name: "Poster",
    icon: "Image",
    color: "#E4405F",
    description: "Event posters, movie posters, promotional posters",
    promptInstruction: "Generate 1 poster design prompt for a completely random and original concept. Do not repeat any concept from previous generations. Be creative — pick an unexpected theme, unique color palette, and distinctive typography. Avoid mountains, sunsets, and generic landscapes.",
  },
  {
    id: "logo",
    name: "Logo",
    icon: "PenTool",
    color: "#FF6B35",
    description: "Brand logos, icons, typography marks",
    promptInstruction: "Generate 1 logo design prompt for a completely new and original imaginary brand that you invent right now. Do not reuse any concept from previous generations. Describe the symbol, typography, and color scheme. Avoid mountains, trees, sun, circles, and generic nature symbols.",
  },
  {
    id: "branding",
    name: "Branding",
    icon: "Palette",
    color: "#8B5CF6",
    description: "Brand identity, style guides, brand kits",
    promptInstruction: "Generate 1 branding design prompt for an entirely new brand identity that you invent. Be original — pick an unexpected industry and create a unique visual direction. Include color palette, typography, and texture suggestions. Do not repeat themes from previous outputs.",
  },
  {
    id: "infographic",
    name: "Infographic",
    icon: "BarChart3",
    color: "#2D7D46",
    description: "Data visualization, charts, timelines",
    promptInstruction: "Generate 1 infographic design prompt about a surprising or unusual topic. Invent the data and the story. Avoid common topics like climate change or social media. Be creative with the visualization style and layout.",
  },
  {
    id: "product",
    name: "Product",
    icon: "Package",
    color: "#0EA5E9",
    description: "Product shots, mockups, packaging",
    promptInstruction: "Generate 1 product mockup design prompt for an unexpected or unique product. Invent the product if needed. Describe lighting, angle, background, and mood. Avoid plain white backgrounds. Be creative with the setting.",
  },
  {
    id: "ads-creative",
    name: "Ads Creative",
    icon: "Megaphone",
    color: "#F59E0B",
    description: "Social media ads, banner ads, promotional graphics",
    promptInstruction: "Generate 1 ad creative design prompt for a fictional brand and campaign that you invent. Come up with a catchy brand name, a unique selling point, and a creative visual direction. Include headline, CTA style, color psychology, and format. Do not repeat campaign ideas.",
  },
];
