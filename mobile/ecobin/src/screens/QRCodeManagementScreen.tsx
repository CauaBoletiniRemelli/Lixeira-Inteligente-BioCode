import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { BackButton, Loading, Button, Card } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { provisionamentoService, Provisionamento } from '../services/provisionamentoService';
import { useAuth } from '../contexts/AuthContext';
import { ENV } from '../config/env';

interface QRCodeManagementScreenProps {
  onNavigateBack?: () => void;
}

export const QRCodeManagementScreen: React.FC<QRCodeManagementScreenProps> = ({
  onNavigateBack,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [provisionamentos, setProvisionamentos] = useState<Provisionamento[]>([]);
  const [generatingQR, setGeneratingQR] = useState<number | null>(null);

  useEffect(() => {
    loadProvisionamentos();
  }, []);

  const loadProvisionamentos = async () => {
    try {
      setLoading(true);
      const response = await provisionamentoService.listar();

      if (response.status && response.dados) {
        // Ordena por data de criação (mais recentes primeiro)
        const sorted = response.dados.sort((a, b) => 
          new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
        );
        setProvisionamentos(sorted);
      } else {
        Alert.alert('Erro', response.mensagem || 'Erro ao carregar provisionamentos');
      }
    } catch (error: any) {
      console.error('Erro ao carregar provisionamentos:', error);
      Alert.alert('Erro', 'Erro ao carregar a lista de provisionamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProvisionamento = async () => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não identificado');
      return;
    }

    try {
      setLoading(true);

      // O backend exige um sensorId válido ao criar o provisionamento
      // Vamos criar um sensor temporário primeiro
      const requestData = {
        sensorId: 1, // TODO: Criar sensor temporário ou pegar um existente
        usuarioId: user.id,
        expiracaoDias: 30, // QR válido por 30 dias
      };
      
      console.log('📤 Enviando request para criar provisionamento:', requestData);
      
      const response = await provisionamentoService.criar(requestData);
      
      console.log('📥 Resposta da API:', response);

      if (response.status && response.dados) {
        Alert.alert('Sucesso', 'QR Code criado com sucesso!');
        loadProvisionamentos();
      } else {
        console.error('❌ Erro na resposta:', response);
        Alert.alert('Erro', response.mensagem || 'Erro ao criar provisionamento');
      }
    } catch (error: any) {
      console.error('❌ Erro ao criar provisionamento:', error);
      console.error('📄 Response data:', error.response?.data);
      console.error('📄 Response status:', error.response?.status);
      console.error('📄 Response headers:', error.response?.headers);
      
      const mensagem = error.response?.data?.mensagem || 'Erro ao criar o código de provisionamento';
      Alert.alert('Erro', mensagem);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndShareQR = async (provisionId: number) => {
    try {
      setGeneratingQR(provisionId);

      // Por enquanto, mostra um alerta informando que o QR será gerado
      // A implementação completa com download/compartilhamento requer
      // configuração adicional no expo-file-system
      Alert.alert(
        'QR Code',
        `Para gerar o QR Code de provisionamento #${provisionId}, acesse:\n\n${ENV.API_URL}Provisionamentos/gerar-qr/${provisionId}\n\nVocê pode abrir este link em um navegador para baixar a imagem.`,
        [
          {
            text: 'Copiar Link',
            onPress: () => {
              // TODO: Implementar cópia para clipboard
              Alert.alert('Link', `${ENV.API_URL}Provisionamentos/gerar-qr/${provisionId}`);
            }
          },
          { text: 'OK' }
        ]
      );

      setGeneratingQR(null);
    } catch (error: any) {
      console.error('Erro ao gerar QR code:', error);
      Alert.alert('Erro', 'Erro ao gerar o QR Code');
      setGeneratingQR(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (expiracaoString: string) => {
    return new Date(expiracaoString) < new Date();
  };

  if (loading && provisionamentos.length === 0) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BackButton onPress={() => onNavigateBack?.()} />
        <Text style={styles.headerTitle}>QR Codes de Provisionamento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        <Button
          title="Criar Novo QR Code"
          onPress={handleCreateProvisionamento}
          loading={loading}
        />

        <Text style={styles.sectionTitle}>
          QR Codes Criados ({provisionamentos.length})
        </Text>

        {provisionamentos.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="qr-code-outline" size={48} color={COLORS.text.secondary} />
            <Text style={styles.emptyText}>
              Nenhum QR Code criado ainda
            </Text>
            <Text style={styles.emptySubtext}>
              Toque no botão acima para criar o primeiro
            </Text>
          </Card>
        ) : (
          provisionamentos.map((item) => {
            const expired = isExpired(item.expiracao);
            const isGenerating = generatingQR === item.id;

            return (
              <Card key={item.id} style={styles.qrCard}>
                <View style={styles.qrCardHeader}>
                  <View style={styles.qrIdContainer}>
                    <Ionicons name="qr-code" size={24} color={COLORS.primary} />
                    <Text style={styles.qrId}>ID: {item.id}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    item.usado 
                      ? styles.statusUsed 
                      : expired 
                      ? styles.statusExpired 
                      : styles.statusActive
                  ]}>
                    <Text style={styles.statusText}>
                      {item.usado ? 'USADO' : expired ? 'EXPIRADO' : 'ATIVO'}
                    </Text>
                  </View>
                </View>

                <View style={styles.qrDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.detailLabel}>Criado em:</Text>
                    <Text style={styles.detailValue}>{formatDate(item.criadoEm)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color={COLORS.text.secondary} />
                    <Text style={styles.detailLabel}>Expira em:</Text>
                    <Text style={[
                      styles.detailValue,
                      expired && styles.expiredText
                    ]}>
                      {formatDate(item.expiracao)}
                    </Text>
                  </View>
                  {item.sensorId > 0 && (
                    <View style={styles.detailRow}>
                      <Ionicons name="hardware-chip-outline" size={16} color={COLORS.text.secondary} />
                      <Text style={styles.detailLabel}>Sensor:</Text>
                      <Text style={styles.detailValue}>#{item.sensorId}</Text>
                    </View>
                  )}
                </View>

                {!item.usado && !expired && (
                  <TouchableOpacity
                    style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                    onPress={() => handleGenerateAndShareQR(item.id)}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <ActivityIndicator size="small" color={COLORS.background} />
                    ) : (
                      <>
                        <Ionicons name="share-outline" size={20} color={COLORS.background} />
                        <Text style={styles.generateButtonText}>
                          Gerar e Compartilhar QR
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  infoCard: {
    marginBottom: SPACING.md,
    backgroundColor: `${COLORS.primary}08`,
  },
  infoIconContainer: {
    marginBottom: SPACING.xs,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  qrCard: {
    marginBottom: SPACING.md,
  },
  qrCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  qrIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  qrId: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusActive: {
    backgroundColor: `${COLORS.success}20`,
  },
  statusUsed: {
    backgroundColor: `${COLORS.text.secondary}20`,
  },
  statusExpired: {
    backgroundColor: `${COLORS.error}20`,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  qrDetails: {
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  expiredText: {
    color: COLORS.error,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
});
