import { BRAND_NAME, brandNameInline } from "@/lib/homepage-ui";

type BrandNameProps = {
  className?: string;
};

export default function BrandName({ className }: BrandNameProps) {
  return <span className={className ? `${brandNameInline} ${className}` : brandNameInline}>{BRAND_NAME}</span>;
}
