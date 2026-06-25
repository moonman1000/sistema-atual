import React from 'react';

interface OrderTrackingMapProps {
  trackinglink: string; // Renomeado de trackingLink para trackinglink
}

const OrderTrackingMap: React.FC<OrderTrackingMapProps> = ({ trackinglink }) => {
  const [iframeError, setIframeError] = React.useState(false);

  React.useEffect(() => {
    setIframeError(false); // Reset error state when trackinglink changes
  }, [trackinglink]);

  if (!trackinglink) {
    return <p className="text-muted-foreground text-center">Link de rastreamento não disponível.</p>;
  }

  // Basic check for a valid-looking URL
  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  const isGoogleMapsShareLink = trackinglink.includes("maps.app.goo.gl") || trackinglink.includes("google.com/maps/place");
  const isGoogleMapsEmbedLink = trackinglink.includes("google.com/maps/embed");

  if (!isValidUrl(trackinglink)) {
    return (
      <div className="text-center p-4 border rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300">
        <p className="font-semibold">Link de rastreamento inválido.</p>
        <p className="text-sm mt-2">Por favor, insira uma URL válida para o mapa.</p>
      </div>
    );
  }

  if (isGoogleMapsShareLink && !isGoogleMapsEmbedLink) {
    return (
      <div className="text-center p-4 border rounded-lg bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
        <p className="font-semibold">Este link do Google Maps pode não ser incorporável diretamente.</p>
        <p className="text-sm mt-2">Para incorporar um mapa, vá ao Google Maps, clique em "Compartilhar", depois em "Incorporar um mapa" e copie o URL do atributo 'src' do iframe.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-border shadow-sm">
      {iframeError ? (
        <div className="flex items-center justify-center h-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 p-4 text-center">
          <p className="font-semibold">Não foi possível carregar o mapa.</p>
          <p className="text-sm mt-2">Verifique se o link de rastreamento está correto e é permitido para incorporação.</p>
        </div>
      ) : (
        <iframe
          src={trackinglink}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Mapa de Rastreamento"
          onError={() => setIframeError(true)}
        ></iframe>
      )}
    </div>
  );
};

export default OrderTrackingMap;