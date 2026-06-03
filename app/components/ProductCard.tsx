import "./ProductCard.css";
import { Bicicletta } from "@/lib/schemas/bicicletta.schema";

export default function ProductCard({ product }: { product: Bicicletta }) {
  const nomeModello = product.modello?.nome || `Modello #${product.modelloId}`;
  
  // 1. Controlla se ALMENO una delle tipologie associate contiene la parola "elettrica"
  const isElettrica = product.tipologie?.some((t) => 
    t.nome.toLowerCase().includes("elettrica")
  ) ?? false;

  return (
    <div className="product-card group">
      {/* Sfondo luminoso soffuso */}
      <div className="card-glow" />

      <div className="card-content">
        
        {/* Parte Superiore: Badge e Info */}
        <div>
          <div className="card-header flex justify-between items-start gap-2">
            
            {/* 2. AGGIORNATO: Ciclo sull'array delle tipologie per stampare tutti i badge associati */}
            <div className="flex flex-wrap gap-1">
              {product.tipologie && product.tipologie.length > 0 ? (
                product.tipologie.map((t) => {
                  const checkElettrica = t.nome.toLowerCase().includes("elettrica");
                  return (
                    <span 
                      key={t.id} 
                      className={`card-badge ${checkElettrica ? 'badge-electric' : 'badge-standard'}`}
                    >
                      {t.nome}
                    </span>
                  );
                })
              ) : (
                <span className="card-badge badge-standard">Generica</span>
              )}
            </div>

            {/* Elenco delle Taglie disponibili */}
            <div className="card-size-container">
              {product.dimensioni && product.dimensioni.length > 0 ? (
                product.dimensioni.map((d) => (
                  <span 
                    key={d.id} 
                    className="card-size" 
                    title={`${d.numeroBiciclette} disponibili`}
                  >
                    {d.taglia}
                  </span>
                ))
              ) : (
                <span className="card-size">N/A</span>
              )}
            </div>
          </div>

          {/* Nome della Bicicletta */}
          <h3 className="card-title">
            {nomeModello}
          </h3>
        </div>

        {/* Parte Centrale: Icona / Emoji Dinamica */}
        <div className="card-media-wrapper">
          <span className="card-emoji">
            {isElettrica ? "⚡" : "🚲"}
          </span>
          <div className="card-decor-line" />
        </div>

        {/* Parte Inferiore: Pulsante di Azione */}
        <button className="card-button">
          <span>Configura e Prenota</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth={2.5} 
            stroke="currentColor" 
            className="card-button-icon"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5l6 6m0 0l-6 6m6-6H3" />
          </svg>
        </button>

      </div>
    </div>
  );
}