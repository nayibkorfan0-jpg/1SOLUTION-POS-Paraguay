import { ServicePopular } from '../ServicePopular';

export default function ServicePopularExample() {
  const mockServices = [
    {
      name: 'Lavado Full Detail',
      count: 12,
      revenue: 540000,
      vehicleBreakdown: { auto: 8, suv: 3, camioneta: 1, moto: 0 },
      percentage: 35
    },
    {
      name: 'Lavado Básico',
      count: 8,
      revenue: 200000,
      vehicleBreakdown: { auto: 6, suv: 0, camioneta: 0, moto: 2 },
      percentage: 25
    },
    {
      name: 'Pulido',
      count: 6,
      revenue: 360000,
      vehicleBreakdown: { auto: 4, suv: 2, camioneta: 0, moto: 0 },
      percentage: 20
    },
    {
      name: 'Aspirado',
      count: 4,
      revenue: 60000,
      vehicleBreakdown: { auto: 2, suv: 0, camioneta: 0, moto: 2 },
      percentage: 15
    },
    {
      name: 'Tratamiento Anti-Hongos',
      count: 2,
      revenue: 80000,
      vehicleBreakdown: { auto: 1, suv: 1, camioneta: 0, moto: 0 },
      percentage: 5
    }
  ];

  return (
    <div className="max-w-md">
      <ServicePopular
        services={mockServices}
        totalServices={32}
        totalRevenue={1240000}
        mostPopular="Lavado Full Detail"
      />
    </div>
  );
}