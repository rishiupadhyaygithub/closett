import { useModal } from '../lib/useModal';

interface MergeOfferModalProps {
  itemCount: number;
  onMerge: () => void;
  onDiscard: () => void;
}

/** After signing in on a browser that had its own pieces: offer to add them to the saved closet. */
export default function MergeOfferModal({ itemCount, onMerge, onDiscard }: MergeOfferModalProps) {
  const ref = useModal(true, onDiscard);
  return (
    <div className="modal-overlay">
      <div ref={ref} className="modal-box" role="dialog" aria-modal="true" aria-labelledby="merge-title">
        <div className="modal-header"><h2 id="merge-title" className="modal-title">Add the pieces from this browser?</h2></div>
        <div className="modal-body">
          <p className="recovery-text">
            Before you signed in, this browser had its own closet with {itemCount} piece{itemCount !== 1 ? 's' : ''}. Add them to your saved closet?
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onDiscard}>Discard them</button>
          <button className="btn-primary" onClick={onMerge}>Add them</button>
        </div>
      </div>
    </div>
  );
}
