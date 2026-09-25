import React, { useState } from 'react';
import { Review } from '../types';
import { storage } from '../utils/storage';
import { Star, MessageSquare, Plus, Check, ShieldCheck, User } from 'lucide-react';

interface ReviewsViewProps {
  reviews: Review[];
  onReviewAdded: () => void;
}

export const ReviewsView: React.FC<ReviewsViewProps> = ({ reviews, onReviewAdded }) => {
  const [filterRating, setFilterRating] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);

  // New review form
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [carPurchased, setCarPurchased] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const approvedReviews = reviews.filter((r) => r.approved);
  
  const filteredReviews = filterRating > 0
    ? approvedReviews.filter((r) => r.rating === filterRating)
    : approvedReviews;

  const averageRating = approvedReviews.length > 0
    ? (approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length).toFixed(1)
    : '5.0';

  const handleAddReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author || !comment) return;

    storage.addReview({
      author,
      rating,
      comment,
      carPurchased: carPurchased || undefined,
      userAvatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`
    });

    setSubmitted(true);
    onReviewAdded();
    setTimeout(() => {
      setSubmitted(false);
      setShowAddModal(false);
      setAuthor('');
      setComment('');
      setCarPurchased('');
    }, 2000);
  };

  return (
    <div className="space-y-10 pb-12">
      {/* Header Banner */}
      <div className="bg-[#0a0a0a] border border-white/10 p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 text-[#D4AF37] text-[10px] font-semibold uppercase tracking-[0.25em]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Testimonios Certificados</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-light text-white">
            Opiniones & Experiencias
          </h1>
          <p className="text-white/40 text-xs font-light leading-relaxed">
            Conozca las valoraciones de nuestros clientes sobre el proceso de selección, adquisición y atención personalizada en Black Swan.
          </p>
        </div>

        {/* Rating Score Card */}
        <div className="bg-[#050505] border border-[#D4AF37]/30 p-6 flex items-center gap-6 shrink-0">
          <div className="text-center">
            <span className="text-4xl font-serif text-[#D4AF37] block">{averageRating}</span>
            <div className="flex items-center justify-center text-[#D4AF37] mt-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-[#D4AF37] text-[#D4AF37]" />
              ))}
            </div>
            <span className="text-[9px] text-white/40 uppercase tracking-wider block mt-1">{approvedReviews.length} valoraciones</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="py-3 px-5 text-[10px] uppercase font-bold tracking-[0.2em] bg-[#D4AF37] hover:bg-[#c4a02e] text-black transition-all flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publicar Reseña</span>
          </button>
        </div>
      </div>

      {/* Filter by Stars */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        <span className="text-white/40 uppercase tracking-widest text-[10px] mr-2 shrink-0 font-medium">Filtrar:</span>
        <button
          onClick={() => setFilterRating(0)}
          className={`px-4 py-2 border text-[10px] uppercase tracking-widest font-bold transition-all shrink-0 ${
            filterRating === 0 ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#0a0a0a] text-white/70 border-white/10 hover:border-white/20'
          }`}
        >
          Todas ({approvedReviews.length})
        </button>
        {[5, 4, 3].map((star) => (
          <button
            key={star}
            onClick={() => setFilterRating(star)}
            className={`px-4 py-2 border text-[10px] uppercase tracking-widest font-bold transition-all shrink-0 flex items-center gap-1 ${
              filterRating === star ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'bg-[#0a0a0a] text-white/70 border-white/10 hover:border-white/20'
            }`}
          >
            <span>{star} Estrellas</span>
            <Star className="w-3 h-3 fill-current" />
          </button>
        ))}
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredReviews.map((rev) => (
          <div key={rev.id} className="bg-[#0a0a0a] border border-white/10 p-6 space-y-4 hover:border-[#D4AF37]/40 transition-all">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <img 
                  src={rev.userAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'} 
                  alt={rev.author}
                  className="w-9 h-9 rounded-full object-cover border border-white/10"
                />
                <div>
                  <h4 className="text-sm font-serif text-white">{rev.author}</h4>
                  {rev.carPurchased && (
                    <span className="text-[10px] text-[#D4AF37] uppercase tracking-wider block">
                      {rev.carPurchased}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center text-[#D4AF37]">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-white/30 block mt-0.5">{rev.date}</span>
              </div>
            </div>

            <p className="text-xs text-white/70 leading-relaxed font-light italic bg-[#050505] p-4 border border-white/5">
              "{rev.comment}"
            </p>

            <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-emerald-400 font-semibold pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cliente Verificado Black Swan</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#050505] border border-white/10 p-6 sm:p-8 w-full max-w-lg space-y-4 relative">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-serif text-white uppercase tracking-wider">Publicar Reseña</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white text-[10px] uppercase font-bold tracking-widest">
                Cerrar
              </button>
            </div>

            {submitted ? (
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-6 text-center space-y-2">
                <Check className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-serif text-white">Reseña recibida</h4>
                <p className="text-xs text-white/60 font-light">Tu testimonio quedará visible después de su aprobación.</p>
              </div>
            ) : (
              <form onSubmit={handleAddReviewSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Marcelo Rossi"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Vehículo (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej: BMW M3 / Golf GTI"
                    value={carPurchased}
                    onChange={(e) => setCarPurchased(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Calificación</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setRating(s)}
                        className={`p-2 border transition-all ${
                          rating >= s ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]' : 'bg-[#0a0a0a] border-white/10 text-white/30'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${rating >= s ? 'fill-[#D4AF37]' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-white/50 text-[10px] uppercase tracking-widest mb-1.5">Experiencia *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Escriba su reseña sobre el servicio y la unidad..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 px-3.5 py-2.5 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#D4AF37] hover:bg-[#c4a02e] text-black font-bold uppercase tracking-[0.2em] text-[10px]"
                >
                  Publicar Reseña
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
