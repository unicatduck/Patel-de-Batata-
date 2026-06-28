# 🥔 Patel de Batata

Leitor de música para Android e iOS com shuffle verdadeiro, playlists automáticas por artista e renomeação de músicas.

## Funcionalidades

- **Shuffle verdadeiro** — algoritmo Fisher-Yates com histórico de reprodução; músicas tocadas recentemente vão para o fim da fila, garantindo máxima variedade
- **Playlists manuais** — cria, edita e apaga as tuas próprias playlists
- **Playlists automáticas por artista** — o app agrupa automaticamente todas as músicas do mesmo artista numa playlist
- **Renomeação de músicas** — corrige o nome de exibição de qualquer música (título e artista) sem alterar o ficheiro original
- **Auto-renomeação** — deteta músicas com nomes "sujos" (números de faixa, underscores, etc.) e sugere correções automáticas
- **Pesquisa** — procura por título, artista ou álbum
- **Reprodução em segundo plano** — continua a tocar com o ecrã bloqueado

## Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

```bash
npm install -g expo-cli
```

### Correr no telemóvel (Expo Go)

```bash
npm install
npx expo start
```

Lê o QR code com a app **Expo Go** (iOS/Android).

### Build APK (Android)

```bash
npm install -g eas-cli
eas build --platform android --profile preview
```

## Utilização

1. Abre a app e vai a **Biblioteca → Procurar músicas** (ícone de refresh)
2. Concede permissão de acesso aos ficheiros de áudio
3. As músicas aparecem automaticamente; playlists por artista são criadas em **Definições → Criar playlists por artista**
4. Para renomear músicas: **Definições → Renomear músicas**
5. Para criar uma playlist manual: **Biblioteca → Nova Playlist**

## Estrutura do projeto

```
src/
├── context/
│   ├── LibraryContext.tsx   # Músicas, playlists, renomeação
│   └── PlayerContext.tsx    # Motor de reprodução de áudio
├── screens/
│   ├── HomeScreen.tsx
│   ├── LibraryScreen.tsx
│   ├── PlayerScreen.tsx
│   ├── SearchScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── ArtistScreen.tsx
│   ├── PlaylistDetailScreen.tsx
│   └── CreatePlaylistScreen.tsx
├── components/
│   ├── MiniPlayer.tsx
│   ├── SongItem.tsx
│   └── ArtworkPlaceholder.tsx
└── utils/
    ├── shuffle.ts    # Fisher-Yates com histórico
    ├── format.ts     # Formatação e parsing de nomes
    └── storage.ts    # AsyncStorage helpers
```
