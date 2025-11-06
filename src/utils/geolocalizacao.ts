import { Geolocation } from '@capacitor/geolocation';
import { Localizacao } from '../types';

export async function obterLocalizacao(): Promise<Localizacao | null> {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });
    
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    console.error('Erro ao obter localização:', error);
    return null;
  }
}

export function calcularDistancia(
  loc1: Localizacao,
  loc2: Localizacao
): number {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = (loc1.latitude * Math.PI) / 180;
  const φ2 = (loc2.latitude * Math.PI) / 180;
  const Δφ = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const Δλ = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distância em metros
}

export function formatarDistancia(distancia: number): string {
  if (distancia < 1000) {
    return `${Math.round(distancia)}m`;
  }
  return `${(distancia / 1000).toFixed(1)}km`;
}

