# Instruções para Usar NutriScan no AppGyser

## Visão Geral
O NutriScan foi atualizado para funcionar perfeitamente com aplicações construídas via AppGyser, incluindo suporte completo para câmera nativa do dispositivo.

## Alterações Implementadas

### 1. **Suporte para Cordova Camera Plugin**
- O aplicativo agora detecta automaticamente se está sendo executado como um app nativo (AppGyser)
- Se o Cordova estiver disponível, usa a câmera nativa do dispositivo
- Fallback automático para a API web se o Cordova não estiver disponível

### 2. **Permissões Configuradas**
- **Android**: Permissões de câmera, acesso a fotos e internet
- **iOS**: NSCameraUsageDescription e acesso a biblioteca de fotos
- As permissões estão no arquivo `config.xml`

### 3. **Inicialização Melhorada**
- Aguarda o evento `deviceready` do Cordova antes de inicializar a aplicação
- Garante que todos os plugins estejam carregados

## Como Usar no AppGyser

### Passos para Compilar:

1. **Acesse o AppGyser** (www.appsgeyser.com)
2. **Crie uma novo aplicativo** com:
   - **URL da Web App**: `https://seusite.com` (onde seu build do NutriScan está hospedado)
   - **Plugins Necessários**:
     - Cordova Camera Plugin (v6.0.0 ou superior)
     - Cordova File Plugin (v7.0.0 ou superior)

3. **Permissões do Android**:
   - ✅ Camera
   - ✅ Read External Storage
   - ✅ Write External Storage
   - ✅ Internet

4. **Permissões do iOS** (se aplicável):
   - ✅ Camera
   - ✅ Photo Library

### Fluxo de Câmera Implementado:

```
Usuário clica em "Scanner"
         ↓
[Detecta plataforma]
         ↓
   ┌─────┴─────┐
   │           │
[Cordova]   [Web]
   │           │
[Native]   [getUserMedia]
Camera       Camera
   │           │
   └─────┬─────┘
         ↓
   [Captura Imagem]
         ↓
[Analisa com Gemini]
```

## Funcionalidades Suportadas

✅ **Câmera Nativa** - Captura fotos com câmera traseira
✅ **Compressão Otimizada** - Reduz tamanho mantendo qualidade
✅ **Retry Automático** - 3 tentativas com diferentes compressões
✅ **Tratamento de Erros** - Mensagens claras em português, inglês, francês e chinês
✅ **Offline Support** - Funciona mesmo sem internet (análise é feita online, mas interface é responsiva)

## Troubleshooting

### Problema: "Câmera não abre"
**Solução**:
1. Verifique se o plugin de câmera está instalado no AppGyser
2. Confirme que as permissões de câmera estão ativadas no dispositivo
3. Verifique os logs no console do navegador (pressione F12)

### Problema: "Erro ao analisar. Escolha uma foto mais nítida"
**Solução**:
1. Garanta boa iluminação e foto nítida
2. O sistema fará até 3 tentativas com compressão progressiva
3. Se persistir, tente a opção "Importar Arquivo" para fotos de galeria

### Problema: Permissões não são solicitadas
**Solução**:
1. Reinstale o aplicativo
2. Vá para Configurações > Aplicativos > NutriScan > Permissões
3. Ative manualmente as permissões de câmera e armazenamento

## Arquivos Importantes

- `config.xml` - Configuração do Cordova (plugins e permissões)
- `index.html` - Inclui script do Cordova
- `index.tsx` - Inicializa o Cordova antes da aplicação
- `components/Scanner.tsx` - Detecta e usa câmera nativa

## Versão Mínima de Android/iOS

- **Android**: 5.0 (API 21) ou superior
- **iOS**: 10.0 ou superior

## Notas Importantes

1. O `cordova.js` é injetado automaticamente pelo AppGyser - não precisa ser incluído manualmente
2. O aplicativo funciona tanto em modo web quanto como app nativo
3. As traduções já estão integradas em 4 idiomas

## Suporte

Para mais informações sobre AppGyser, visite: https://www.appsgeyser.com/
Para suporte técnico com Cordova: https://cordova.apache.org/
