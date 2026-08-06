export const GOOGLE_CONFIG = {
  // Vai a https://console.cloud.google.com, cria um projeto,
  // ativa a Google Drive API e cria credenciais OAuth 2.0:
  //   1. Tipo "Web Application" → copia o Client ID para webClientId
  //   2. Tipo "Android", package com.pateldebatata.app → copia para androidClientId
  webClientId: '14576052564-7gsa8am8oriranjup7bcfi52i5vqacn0.apps.googleusercontent.com',
  androidClientId: '14576052564-qd77g8sb89r45b1uar7qoegoftdul8um.apps.googleusercontent.com',
  get configured(): boolean {
    return !!(this.webClientId && this.androidClientId);
  },
};
