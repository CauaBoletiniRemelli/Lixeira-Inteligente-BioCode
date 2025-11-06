import { Alert } from 'react-native';

interface ApiResponse<T = any> {
  dados: T | null;
  mensagem: string;
  status: boolean;
}

export const showApiAlert = (
  response: ApiResponse,
  successTitle: string = 'Sucesso',
  errorTitle: string = 'Erro'
) => {
  if (response.status) {
    Alert.alert(successTitle, response.mensagem);
  } else {
    Alert.alert(errorTitle, response.mensagem);
  }
};

export const showSuccessAlert = (
  response: ApiResponse,
  title: string = 'Sucesso'
) => {
  Alert.alert(title, response.mensagem);
};

export const showErrorAlert = (
  response: ApiResponse,
  title: string = 'Erro'
) => {
  Alert.alert(title, response.mensagem);
};

export const handleApiError = (
  error: any,
  defaultMessage: string = 'Ocorreu um erro. Tente novamente.'
) => {
  let errorMessage = defaultMessage;
  
  if (error.response?.data?.mensagem) {
    errorMessage = error.response.data.mensagem;
  } 
  else if (error.request && !error.response) {
    errorMessage = 'Erro de conexão. Verifique sua internet.';
  }
  else if (error.message) {
    errorMessage = error.message;
  }

  Alert.alert('Erro', errorMessage);
  return errorMessage;
};

export const showConfirmAlert = (
  title: string,
  message: string,
  confirmText: string = 'Confirmar',
  cancelText: string = 'Cancelar'
): Promise<boolean> => {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelText,
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: confirmText,
          onPress: () => resolve(true),
        },
      ],
      { cancelable: false }
    );
  });
};

export const tryWithAlert = async <T>(
  asyncFn: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    handleApiError(error, errorMessage);
    return null;
  }
};
