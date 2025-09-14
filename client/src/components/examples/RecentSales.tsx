import { RecentSales } from '../RecentSales';

export default function RecentSalesExample() {
  const mockSales = [
    {
      id: '001234',
      client: 'María González',
      time: '10:30',
      service: 'Lavado Full Detail',
      vehicle: 'SUV',
      status: 'completado' as const,
      amount: 45000,
      orderNumber: '#001234'
    },
    {
      id: '001235',
      client: 'Carlos Mendoza',
      time: '11:15',
      service: 'Lavado Básico',
      vehicle: 'Auto',
      status: 'en-proceso' as const,
      amount: 25000,
      orderNumber: '#001235'
    },
    {
      id: '001236',
      client: 'Ana Rodríguez',
      time: '12:00',
      service: 'Pulido + Inyección',
      vehicle: 'Camioneta',
      status: 'completado' as const,
      amount: 85000,
      orderNumber: '#001236'
    },
    {
      id: '001237',
      client: 'Roberto Silva',
      time: '12:30',
      service: 'Aspirado',
      vehicle: 'Moto',
      status: 'completado' as const,
      amount: 15000,
      orderNumber: '#001237'
    },
    {
      id: '001238',
      client: 'Lucia Benítez',
      time: '13:45',
      service: 'Paquete Turismo',
      vehicle: 'Auto',
      status: 'pendiente' as const,
      amount: 60000,
      orderNumber: '#001238'
    }
  ];

  return (
    <div className="max-w-md">
      <RecentSales sales={mockSales} total={230000} />
    </div>
  );
}