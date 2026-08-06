export const GOOGLE_CONFIG = {
  // Vai a https://console.cloud.google.com, cria um projeto,
  // ativa a Google Drive API e cria credenciais OAuth 2.0:
  //   1. Tipo "Web Application" → copia o Client ID para webClientId
  //   2. Tipo "Android", package com.pateldebatata.app → copia para androidClientId
  webClientId: '',
  androidClientId: '',
  get configured(): boolean {
    return !!(this.webClientId && this.androidClientId);
  },
};
