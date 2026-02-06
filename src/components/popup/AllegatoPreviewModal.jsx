function getExt(name = '') {
  const n = String(name).toLowerCase();
  const i = n.lastIndexOf('.');
  return i >= 0 ? n.slice(i + 1) : '';
}

function isPdf(mimetype, name) {
  const ext = getExt(name);
  return mimetype === 'application/pdf' || ext === 'pdf';
}

function isImage(mimetype, name) {
  const ext = getExt(name);
  if (mimetype?.startsWith('image/')) return true;
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext);
}

function isText(mimetype, name) {
  const ext = getExt(name);
  if (mimetype?.startsWith('text/')) return true;
  return ['txt', 'log', 'csv', 'json', 'xml'].includes(ext);
}

export default function AllegatoPreviewModal({ open, allegato, onClose }) {
  if (!open || !allegato) return null;

  const url = allegato.absoluteUrl || allegato.url;
  const name = allegato.original_name || allegato.nome_file || allegato.label || 'allegato';
  const mimetype = allegato.mimetype || '';

  const pdf = isPdf(mimetype, name);
  const img = isImage(mimetype, name);
  const txt = isText(mimetype, name);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.75)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 'min(1100px, 95vw)',
          height: 'min(800px, 90vh)',
          background: '#111',
          borderRadius: 12,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            borderBottom: '1px solid rgba(255,255,255,.15)',
            color: 'white',
          }}
        >
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {name} {mimetype ? <span style={{ opacity: 0.7 }}>({mimetype})</span> : null}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <a className="btn btn--blue btn--pill" href={url} target="_blank" rel="noreferrer">
              Apri
            </a>
            <a className="btn btn--shiny btn--pill" href={url} download>
              Download
            </a>
            <button className="btn btn--danger btn--pill" onClick={onClose}>
              Chiudi
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, background: '#000' }}>
          {pdf && (
            <iframe
              title="PDF Preview"
              src={url}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          )}

          {img && (
            <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
              <img
                src={url}
                alt={name}
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </div>
          )}

          {txt && (
            <iframe
              title="Text Preview"
              src={url}
              style={{ width: '100%', height: '100%', border: 'none', background: 'white' }}
            />
          )}

          {!pdf && !img && !txt && (
            <div style={{ color: 'white', padding: 16, opacity: 0.9 }}>
              <h3 style={{ marginTop: 0 }}>Formato non supportato per anteprima</h3>
              <p style={{ margin: 0 }}>
                Questo tipo di file non è visualizzabile direttamente nel browser. Usa <b>Apri</b>{' '}
                (nuova scheda) oppure <b>Download</b>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
