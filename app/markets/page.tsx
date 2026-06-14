import MarketsContent from "@/components/markets/MarketsContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markets",
};

export default function MarketsPage() {
  return <MarketsContent />;
}
