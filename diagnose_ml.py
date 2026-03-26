import requests
import re

url = "https://mercadolivre.com/sec/1Nsn5dh"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

print(f"--- Diagnóstico de Link ---")
print(f"Input: {url}")

try:
    response = requests.get(url, headers=headers, allow_redirects=True, timeout=10)
    final_url = response.url
    print(f"Final URL: {final_url}")
    
    # Extração de ID
    mlb_match = re.search(r"MLB[-]?(\d+)", final_url, re.IGNORECASE)
    if mlb_match:
        print(f"ID Extraído (Regex): MLB{mlb_match.group(1)}")
    else:
        print("ID Extraído (Regex): FALHA")
        
    # Extração de Dados
    html = response.text
    # Busca og:title com suporte a diferentes aspas
    title_match = re.search(r'property=["\']og:title["\']\s+content=["\']([^"\']+)["\']', html)
    if not title_match:
        title_match = re.search(r'content=["\']([^"\']+)["\']\s+property=["\']og:title["\']', html)
        
    image_match = re.search(r'property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html)
    if not image_match:
        image_match = re.search(r'content=["\']([^"\']+)["\']\s+property=["\']og:image["\']', html)
    
    print(f"Título detectado: {title_match.group(1) if title_match else 'FALHA'}")
    print(f"Imagem detectada: {image_match.group(1) if image_match else 'FALHA'}")
    
except Exception as e:
    print(f"ERRO: {e}")
