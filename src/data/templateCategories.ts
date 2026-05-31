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
    promptInstruction: "Generate 1 detailed poster design prompt for a modern, eye-catching poster layout. Include color palette, typography style, composition, and visual hierarchy suggestions.",
  },
  {
    id: "logo",
    name: "Logo",
    icon: "PenTool",
    color: "#FF6B35",
    description: "Brand logos, icons, typography marks",
    promptInstruction: "Generate 1 detailed logo design prompt for a professional brand logo. Describe the symbol, typography pairing, color scheme, and style (minimalist, geometric, hand-drawn, etc.).",
  },
  {
    id: "branding",
    name: "Branding",
    icon: "Palette",
    color: "#8B5CF6",
    description: "Brand identity, style guides, brand kits",
    promptInstruction: "Generate 1 detailed branding design prompt for a complete brand identity. Include color palette, typography system, pattern textures, and brand element suggestions.",
  },
  {
    id: "infographic",
    name: "Infographic",
    icon: "BarChart3",
    color: "#2D7D46",
    description: "Data visualization, charts, timelines",
    promptInstruction: "Generate 1 detailed infographic design prompt for a data visualization layout. Describe chart types, color coding, iconography, information hierarchy, and layout structure.",
  },
  {
    id: "product",
    name: "Product",
    icon: "Package",
    color: "#0EA5E9",
    description: "Product shots, mockups, packaging",
    promptInstruction: "Generate 1 detailed product mockup design prompt for a product presentation. Describe lighting, angle, background styling, props, and mood.",
  },
  {
    id: "ads-creative",
    name: "Ads Creative",
    icon: "Megaphone",
    color: "#F59E0B",
    description: "Social media ads, banner ads, promotional graphics",
    promptInstruction: "Generate 1 detailed ad creative design prompt for a digital advertisement. Describe headline placement, CTA styling, visual hierarchy, color psychology, and format (square, landscape, story).",
  },
];
