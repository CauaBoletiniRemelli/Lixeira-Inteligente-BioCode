import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { BackButton, Loading, Button, Card, Input } from '../components';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import { provisionamentoService, Provisionamento } from '../services/provisionamentoService';
import { condominiumService, Condominium } from '../services/condominiumService';
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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [nomeSensor, setNomeSensor] = useState('');
  const [condominios, setCondominios] = useState<Condominium[]>([]);
  const [selectedCondominioId, setSelectedCondominioId] = useState<number | null>(null);
  const [expiracaoDias, setExpiracaoDias] = useState('7');

  const [showQRModal, setShowQRModal] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [currentProvisionId, setCurrentProvisionId] = useState<number | null>(null);

  useEffect(() => {
    loadProvisionamentos();
    loadCondominios();
  }, []);

  const loadCondominios = async () => {
    try {
      const response = await condominiumService.getAll();
      if (response.status && response.dados) {
        setCondominios(response.dados);
      }
    } catch (error) {
      console.error('Erro ao carregar condomínios:', error);
    }
  };

  const loadProvisionamentos = async () => {
    try {
      setLoading(true);
      const response = await provisionamentoService.listar();

      if (response.status && response.dados) {
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

    if (!nomeSensor.trim()) {
      Alert.alert('Erro', 'Digite o nome do sensor');
      return;
    }

    if (!selectedCondominioId) {
      Alert.alert('Erro', 'Selecione um condomínio');
      return;
    }

    try {
      setLoading(true);

      const requestData = {
        nomeSensor: nomeSensor.trim(),
        condominioId: selectedCondominioId,
        usuarioId: user.id,
        expiracaoDias: parseInt(expiracaoDias) || 7,
      };


      const response = await provisionamentoService.criarComSensor(requestData);

      if (response.status && response.dados) {
        Alert.alert('Sucesso', 'QR Code criado com sucesso!');
        setShowCreateModal(false);
        setNomeSensor('');
        setSelectedCondominioId(null);
        setExpiracaoDias('7');
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
      setCurrentProvisionId(provisionId);

      const response = await provisionamentoService.gerarQR(provisionId);

      const reader = new FileReader();
      reader.readAsDataURL(response as any);

      reader.onloadend = () => {
        const base64data = reader.result as string;
        setQrImageUrl(base64data);
        setShowQRModal(true);
        setGeneratingQR(null);
      };

      reader.onerror = (error) => {
        console.error('Erro ao converter QR:', error);
        Alert.alert('Erro', 'Erro ao processar a imagem do QR Code');
        setGeneratingQR(null);
      };
    } catch (error: any) {
      console.error('Erro ao gerar QR code:', error);
      console.error('Response:', error.response?.data);
      Alert.alert('Erro', error.response?.data?.mensagem || 'Erro ao gerar o QR Code');
      setGeneratingQR(null);
    }
  };

  const handleShareQR = async () => {
    if (!qrImageUrl || !currentProvisionId) return;

    try {
      const shareUrl = `${ENV.API_URL}Provisionamentos/gerar-qr/${currentProvisionId}`;

      Alert.alert(
        'Compartilhar QR Code',
        'Para compartilhar este QR Code, você pode:\n\n1. Fazer screenshot desta tela\n2. Ou copiar o link abaixo para compartilhar',
        [
          {
            text: 'Copiar Link',
            onPress: () => {
              Alert.alert('Link copiado', shareUrl);
            }
          },
          { text: 'Fechar' }
        ]
      );
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleSaveQR = async () => {
    if (!qrImageUrl || !currentProvisionId) return;

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permissão Negada',
          'É necessário permitir o acesso à galeria para salvar a imagem.'
        );
        return;
      }

      const filename = `qr_provision_${currentProvisionId}_${Date.now()}.png`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      const base64Code = qrImageUrl.split(',')[1];

      await FileSystem.writeAsStringAsync(fileUri, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const asset = await MediaLibrary.createAssetAsync(fileUri);

      try {
        await MediaLibrary.createAlbumAsync('EcoBin', asset, false);
      } catch (e) {
      }

      Alert.alert(
        'Sucesso!',
        'QR Code salvo na galeria com sucesso!',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Erro ao salvar QR code:', error);
      Alert.alert('Erro', 'Não foi possível salvar a imagem na galeria');
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
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>QR Codes de Provisionamento</Text>

        <Button
          title="Criar Novo QR Code"
          onPress={() => setShowCreateModal(true)}
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
                        <Ionicons name="qr-code-outline" size={20} color={COLORS.background} />
                        <Text style={styles.generateButtonText}>
                          Visualizar QR Code
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

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Criar Novo QR Code</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll}>
                <Text style={styles.inputLabel}>Nome do Sensor *</Text>
                <TextInput
                  style={styles.input}
                  value={nomeSensor}
                  onChangeText={setNomeSensor}
                  placeholder="Ex: Lixeira 01"
                  placeholderTextColor={COLORS.text.secondary}
                />

                <Text style={styles.inputLabel}>Condomínio *</Text>
                <ScrollView style={styles.condominiosList} nestedScrollEnabled>
                  {condominios.map((cond) => (
                    <TouchableOpacity
                      key={cond.id}
                      style={[
                        styles.condominioItem,
                        selectedCondominioId === cond.id && styles.condominioItemSelected
                      ]}
                      onPress={() => setSelectedCondominioId(cond.id)}
                    >
                      <Ionicons
                        name={selectedCondominioId === cond.id ? "radio-button-on" : "radio-button-off"}
                        size={20}
                        color={selectedCondominioId === cond.id ? COLORS.primary : COLORS.text.secondary}
                      />
                      <View style={styles.condominioInfo}>
                        <Text style={styles.condominioNome}>{cond.nome}</Text>
                        <Text style={styles.condominioEndereco}>{cond.endereco}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Validade (dias)</Text>
                <TextInput
                  style={styles.input}
                  value={expiracaoDias}
                  onChangeText={setExpiracaoDias}
                  placeholder="7"
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.text.secondary}
                />

                <Text style={styles.infoModalText}>
                  <Ionicons name="information-circle" size={16} color={COLORS.primary} />
                  {' '}O QR Code será válido por {expiracaoDias || 7} dias e poderá ser usado apenas uma vez.
                </Text>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowCreateModal(false)}
                >
                  <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleCreateProvisionamento}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={COLORS.background} />
                  ) : (
                    <Text style={styles.modalButtonTextConfirm}>Criar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>QR Code de Provisionamento</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close" size={28} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>

            {qrImageUrl ? (
              <View style={styles.qrImageContainer}>
                <Image
                  source={{ uri: qrImageUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
                <Text style={styles.qrImageInfo}>
                  ID: {currentProvisionId}
                </Text>
              </View>
            ) : (
              <ActivityIndicator size="large" color={COLORS.primary} />
            )}

            <View style={styles.qrModalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSaveQR}
              >
                <Ionicons name="download-outline" size={20} color={COLORS.background} />
                <Text style={styles.modalButtonTextConfirm}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleShareQR}
              >
                <Ionicons name="share-outline" size={20} color={COLORS.text.primary} />
                <Text style={styles.modalButtonTextCancel}>Compartilhar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '90%',
    paddingBottom: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  modalScroll: {
    padding: SPACING.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: 16,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background,
  },
  condominiosList: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
  },
  condominioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
  },
  condominioItemSelected: {
    backgroundColor: `${COLORS.primary}10`,
  },
  condominioInfo: {
    flex: 1,
  },
  condominioNome: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  condominioEndereco: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  infoModalText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  modalButtonCancel: {
    backgroundColor: COLORS.border,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContent: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.lg,
    width: '90%',
    maxWidth: 400,
    padding: SPACING.lg,
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  qrImageContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  qrImage: {
    width: 280,
    height: 280,
    borderRadius: BORDER_RADIUS.md,
  },
  qrImageInfo: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
    fontWeight: '500',
  },
  qrModalButtons: {
    marginTop: SPACING.md,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  qrModalHint: {
    fontSize: 12,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 18,
  },
});
