import { useRouter } from "next/navigation";
import { BiciclettaResponse } from "@/lib/validators/bicicletta";
import "./ProductCard.css";

interface ProductCardProps {
  product: BiciclettaResponse;
  onBook: () => void;
}

const tipologiaLabel: Record<string, string> = {
  CITY: "City Bike",
  MOUNTAIN: "Mountain Bike",
  GRAVEL: "Gravel",
  ROAD: "Road Bike",
};

export default function ProductCard({ product, onBook }: ProductCardProps) {
  const router = useRouter();

  const prezzoMin = Math.min(...product.specifics.map((s) => s.prezzoGiornata));

  const taglie = [...new Set(product.specifics.map((s) => s.size))];

  return (
    <div className="product-card group">
      <div className="card-glow" />

      <div className="card-content">
        <div>
          <div className="card-header flex justify-between items-start gap-2">
            <span>
              {tipologiaLabel[product.tipologia] ?? product.tipologia}
            </span>

            <div className="card-size-container">
              {taglie.map((taglia) => (
                <span key={taglia} className="card-size">
                  {taglia}
                </span>
              ))}
            </div>
          </div>

          <h3 className="card-title">{product.nome}</h3>

          <p className="text-slate-400 text-xs mt-1">
            da €{prezzoMin.toFixed(2)} / giorno
          </p>
        </div>

        <div className="card-media-wrapper">
          <img
            src="https://www.hwupgrade.it/immagini/RallonRS.webp"
            alt="Bicicletta"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="card-decor-line" />
        </div>

        {/* BOTTONI SEPARATI */}
        <div className="flex gap-2 mt-4">
          <button
            className="card-button flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
          >
            Prenota
          </button>

          <button
            className="card-button flex-1"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/details/${product.id}`);
            }}
          >
            Dettagli
          </button>
        </div>
      </div>
    </div>
  );
}
