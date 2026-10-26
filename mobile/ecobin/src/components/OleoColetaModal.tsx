import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoider } from './KeyboardAvoider';
import { oleoService } from '../services/oleoService';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

export interface RecipienteOleoOpcao {
  sensorId: number;
  nomeSensor: string | null;
  litrosAtuais: number | null;
}

interface OleoColetaModalProps {
  visible: boolean;
  condominioId: number;
  recipientes: RecipienteOleoOpcao[];
  /** Recipiente pré-selecionado ao abrir (padrão: o primeiro). */
  sensorIdInicial?: number;
  onClose: () => void;
  onSaved: () => void;
}

export const OleoColetaModal: React.FC<OleoColetaModalProps> = ({
  visible,
  condominioId,
  recipientes,
  sensorIdInicial,
  onClose,
  onSaved,
}) => {
  const [sensorId, setSensorId] = useState<number | null>(null);
  const [litros, setLitros] = useState('');
  const [destino, setDestino] = useState('');
  const [observacao, setObservacao] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Ao abrir, sugere o volume que o sensor indica no recipiente
  useEffect(() => {
    if (!visible) return;
    const inicial = recipientes.find((r) => r.sensorId === sensorIdInicial) ?? recipientes[0];
    setSensorId(inicial?.sensorId ?? null);
    setLitros(inicial?.litrosAtuais ? String(inicial.litrosAtuais).replace('.', ',') : '');
    setDestino('');
    setObservacao('');
    setFormError(null);
  }, [visible, recipientes, sensorIdInicial]);

  const selectRecipiente = (id: number) => {
    setSensorId(id);
    const r = recipientes.find((x) => x.sensorId === id);
    if (r?.litrosAtuais) setLitros(String(r.litrosAtuais).replace('.', ','));
  };

  const save = async () => {
    const valor = parseFloat(litros.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      setFormError('Informe a quantidade de litros coletados.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await oleoService.registrarColeta({
        condominioId,
        sensorId,
        litros: valor,
        destino: destino.trim() || undefined,
        observacao: observacao.trim() || undefined,
      });
      onSaved();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoider style={styles.overlay}>
        <View style={[styles.content, { paddingBottom: SPACING.md + insets.bottom }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Registrar coleta de óleo</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            {recipientes.length > 1 && (
              <>
                <Text style={styles.label}>Recipiente</Text>
                <View style={styles.chipRow}>
                  {recipientes.map((r) => (
                    <TouchableOpacity
                      key={r.sensorId}
                      style={[styles.chip, sensorId === r.sensorId && styles.chipSelected]}
                      onPress={() => selectRecipiente(r.sensorId)}
                    >
                      <Text style={[styles.chipText, sensorId === r.sensorId && styles.chipTextSelected]}>{r.nomeSensor}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Litros coletados *</Text>
            <TextInput
              style={styles.input}
              value={litros}
              onChangeText={setLitros}
              placeholder="Ex: 12,5"
              placeholderTextColor={COLORS.text.secondary}
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Destino</Text>
            <TextInput
              style={styles.input}
              value={destino}
              onChangeText={setDestino}
              placeholder="Ex: Cooperativa de reciclagem"
              placeholderTextColor={COLORS.text.secondary}
              maxLength={150}
            />

            <Text style={styles.label}>Observação</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={observacao}
              onChangeText={setObservacao}
              placeholder="Opcional"
              placeholderTextColor={COLORS.text.secondary}
              maxLength={500}
              multiline
            />

            {formError && <Text style={styles.error}>{formError}</Text>}

            <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={save} disabled={saving}>
              {saving ? (
                <ActivityIndicator color={COLORS.text.white} />
              ) : (
                <Text style={styles.buttonText}>Salvar coleta</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoider>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  content: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '70%',
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text.primary },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text.primary, marginBottom: 4 },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    fontSize: 14,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: { minHeight: 64, textAlignVertical: 'top' },
  error: { color: COLORS.error, fontSize: 13, marginBottom: SPACING.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}14` },
  chipText: { fontSize: 13, color: COLORS.text.primary },
  chipTextSelected: { color: COLORS.primary, fontWeight: '700' },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.text.white, fontWeight: '700', fontSize: 14 },
});
