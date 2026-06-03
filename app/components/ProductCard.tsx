import "./ProductCard.css";
import { Bicicletta } from "@/lib/schemas/bicicletta.schema";

interface ProductCardProps {
  product: Bicicletta;
  onSelect: () => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  const nomeModello = product.modello?.nome || `Modello #${product.modelloId}`;
  
  const isElettrica = product.tipologie?.some((t) => 
    t.nome.toLowerCase().includes("elettrica")
  ) ?? false;

  return (
    <div className="product-card group cursor-pointer" onClick={onSelect}>
      <div className="card-glow" />
      <div className="card-content">
        
        <div>
          <div className="card-header flex justify-between items-start gap-2">
            <div className="flex flex-wrap gap-1">
              {product.tipologie?.map((t) => (
                <span key={t.id} className={`card-badge ${t.nome.toLowerCase().includes("elettrica") ? 'badge-electric' : 'badge-standard'}`}>
                  {t.nome}
                </span>
              ))}
            </div>

            <div className="card-size-container">
              {product.dimensioni?.map((d) => (
                <span key={d.id} className="card-size">{d.taglia}</span>
              ))}
            </div>
          </div>

          <h3 className="card-title">{nomeModello}</h3>
        </div>

        <div className="card-media-wrapper">
          <span className="card-emoji">{isElettrica ? "⚡" : "🚲"}</span>
          <div className="card-decor-line" />
        </div>

        <button className="card-button" onClick={(e) => { e.stopPropagation(); onSelect(); }}>
          <span>Configura e Prenota</span>
        </button>

      </div>
    </div>
  );
}