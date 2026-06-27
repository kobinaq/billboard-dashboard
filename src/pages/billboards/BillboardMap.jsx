import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import { Button } from "components/ui/Button";
import { Card } from "components/ui/Card";
import { EmptyState } from "components/ui/EmptyState";
import { LoadingSpinner } from "components/ui/LoadingSpinner";
import { PageHeader } from "components/shared/PageHeader";
import { SetupNotice } from "components/shared/SetupNotice";
import { useBillboards } from "hooks/useBillboards";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || "";

const colors = {
  available: "#16a34a",
  occupied: "#d97706",
  maintenance: "#dc2626",
  retired: "#64748b"
};

export default function BillboardMap() {
  const navigate = useNavigate();
  const { data, loading, error } = useBillboards();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || !process.env.REACT_APP_MAPBOX_TOKEN) {
      return;
    }

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-1.0232, 7.9465],
      zoom: 5.4
    });

    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !data?.length) {
      return;
    }

    const markers = data.map((board) => {
      const element = document.createElement("div");
      element.className = "h-4 w-4 rounded-full border-2 border-white shadow";
      element.style.backgroundColor = colors[board.status] || colors.retired;

      const popup = new mapboxgl.Popup({ offset: 16 }).setHTML(
        `
          <div style="padding: 4px 2px; min-width: 180px;">
            <strong>${board.name}</strong>
            <p style="margin: 8px 0 4px; font-size: 12px;">${board.status}</p>
            <p style="margin: 0 0 8px; font-size: 12px;">${board.contracts?.[0]?.clients?.company_name || "No active client"}</p>
            <a href="/billboards/${board.id}" style="color: #1b4332; font-weight: 600;">View details</a>
          </div>
        `
      );

      return new mapboxgl.Marker(element)
        .setLngLat([Number(board.longitude), Number(board.latitude)])
        .setPopup(popup)
        .addTo(mapRef.current);
    });

    return () => markers.forEach((marker) => marker.remove());
  }, [data]);

  return (
    <div className="space-y-6">
      <SetupNotice />
      <PageHeader
        title="Billboard Map"
        description="Monitor inventory distribution and open board details directly from map pins."
        secondaryAction={{ label: "Back to list", onClick: () => navigate("/billboards") }}
      />

      {!process.env.REACT_APP_MAPBOX_TOKEN ? (
        <EmptyState
          title="Mapbox token required"
          description="Add REACT_APP_MAPBOX_TOKEN to render the billboard map and coordinate picker."
        />
      ) : loading ? (
        <LoadingSpinner label="Loading board coordinates..." />
      ) : error ? (
        <EmptyState title="Could not load map data" description={error} />
      ) : (
        <Card className="space-y-4 p-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <p className="text-sm font-semibold text-slate-800">Live board map</p>
              <p className="text-sm text-slate-500">
                Pins are colored by status and centered on Ghana.
              </p>
            </div>
            <Button variant="secondary" onClick={() => navigate("/billboards")}>
              Back to table
            </Button>
          </div>
          <div ref={mapContainerRef} className="h-[70vh] rounded-[1.75rem]" />
        </Card>
      )}
    </div>
  );
}
