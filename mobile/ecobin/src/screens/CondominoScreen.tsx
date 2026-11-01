import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { condominoService, PeriodParams } from '../services/condominoService';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import type { ColetaHistorico, ImpactoAmbiental, LixeiraStatus } from '../types';

interface CondominoScreenProps {
  onBack: () => void;
}


const STATUS_COLOR: Record<string, string> = {
  verde: COLORS.success,
  amarelo: COLORS.warning,
  vermelho: COLORS.error,
};


const LixeiraCard: React.FC<{ item: LixeiraStatus }> = ({ item }) => {
  const bar = Math.min(Math.max(item.nivelOcupacao, 0), 100);
  const color = STATUS_COLOR[item.statusCor] ?? COLORS.primary;

  return (
    <View style={styles.lixeiraCard}>
      <View style={styles.lixeiraHeader}>
        <MaterialCommunityIcons name="delete-outline" size={20} color={color} />
        <Text style={styles.lixeiraName} numberOfLines={1}>{item.nome}</Text>
        <View style={[styles.statusBadge, { backgroundColor: `${color}20` }]}>
          <Text style={[styles.statusText, { color }]}>{item.statusLabel}</Text>
        </View>
      </View>

      <Text style={styles.lixeiraTipo}>{item.tipoLixeira}</Text>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${bar}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barLabel}>{item.nivelOcupacao}%</Text>
    </View>
  );
};


const ImpactoCard: React.FC<{ impacto: Omit<ImpactoAmbiental, 'totalColetas'>; periodoLabel: string }> = ({ impacto, periodoLabel }) => (
  <View style={styles.impactoCard}>
    <Text style={styles.impactoTitle}>Impacto ambiental — {periodoLabel}</Text>
    <View style={styles.impactoRow}>
      <View style={styles.impactoItem}>
        <MaterialCommunityIcons name="recycle" size={28} color={COLORS.primary} />
        <Text style={styles.impactoValue}>{impacto.kgReciclados.toFixed(1)} kg</Text>
        <Text style={styles.impactoLabel}>reciclados</Text>
      </View>
      <View style={styles.impactoItem}>
        <MaterialCommunityIcons name="leaf" size={28} color={COLORS.info} />
        <Text style={styles.impactoValue}>{impacto.co2Evitado.toFixed(1)} kg</Text>
        <Text style={styles.impactoLabel}>CO₂ evitado</Text>
      </View>
      <View style={styles.impactoItem}>
        <MaterialCommunityIcons name="tree" size={28} color={COLORS.success} />
        <Text style={styles.impactoValue}>{impacto.arvoresSalvas.toFixed(2)}</Text>
        <Text style={styles.impactoLabel}>árvores salvas</Text>
      </View>
    </View>
  </View>
);

const ColetaRow: React.FC<{ item: ColetaHistorico }> = ({ item }) => {
  const date = new Date(item.dataColeta);
  const formatted = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.coletaRow}>
      <View style={styles.coletaIcon}>
        <MaterialCommunityIcons name="truck-check-outline" size={18} color={COLORS.primary} />
      </View>
      <View style={styles.coletaInfo}>
        <Text style={styles.coletaNome}>{item.nomeSensor}</Text>
        <Text style={styles.coletaData}>{formatted}</Text>
      </View>
    </View>
  );
};

type PeriodKey = '1m' | '3m' | '6m' | '1a' | 'custom';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: '1m', label: 'Este mês' },
  { key: '3m', label: '3 meses' },
  { key: '6m', label: '6 meses' },
  { key: '1a', label: '1 ano' },
  { key: 'custom', label: 'Personalizado' },
];

const fmtDisplay = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const getPeriodDates = (key: Exclude<PeriodKey, 'custom'>): { dataInicio: string; dataFim: string; label: string } => {
  const now = new Date();
  const dataFim = now.toISOString().slice(0, 10);
  const start = new Date(now);
  if (key === '1m') start.setMonth(start.getMonth() - 1);
  else if (key === '3m') start.setMonth(start.getMonth() - 3);
  else if (key === '6m') start.setMonth(start.getMonth() - 6);
  else start.setFullYear(start.getFullYear() - 1);
  const dataInicio = start.toISOString().slice(0, 10);
  return { dataInicio, dataFim, label: `${fmtDisplay(dataInicio)} — ${fmtDisplay(dataFim)}` };
};

export const CondominoScreen: React.FC<CondominoScreenProps> = ({ onBack }) => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('1m');
  const [periodoLabel, setPeriodoLabel] = useState('');

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date>(new Date());
  const [customError, setCustomError] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [lixeiras, setLixeiras] = useState<LixeiraStatus[]>([]);
  const [impacto, setImpacto] = useState<Omit<ImpactoAmbiental, 'totalColetas'> | null>(null);
  const [coletas, setColetas] = useState<ColetaHistorico[]>([]);

  const fetchWithDates = useCallback(async (dataInicio: string, dataFim: string, label: string) => {
    try {
      setError(null);
      const period: PeriodParams = { dataInicio, dataFim };
      const [home, impactoData, coletasData] = await Promise.all([
        condominoService.getHome(),
        condominoService.getImpacto(undefined, period),
        condominoService.getColetas(50, undefined, period),
      ]);
      setLixeiras(home.lixeiras);
      setImpacto(impactoData);
      setColetas(coletasData);
      setPeriodoLabel(label);
    } catch (e: any) {
      setError(e.message ?? 'Erro ao carregar informações.');
    }
  }, []);

  const fetchAll = useCallback(async (period: Exclude<PeriodKey, 'custom'> = '1m') => {
    const { dataInicio, dataFim, label } = getPeriodDates(period);
    await fetchWithDates(dataInicio, dataFim, label);
  }, [fetchWithDates]);

  useEffect(() => {
    fetchAll('1m').finally(() => setLoading(false));
  }, []);

  const handlePeriodChange = (period: PeriodKey) => {
    if (period === 'custom') {
      setCustomEnd(new Date());
      setCustomStart(null);
      setCustomError('');
      setShowCustomModal(true);
      return;
    }
    setSelectedPeriod(period);
    setLoading(true);
    fetchAll(period).finally(() => setLoading(false));
  };

  const handleCustomApply = () => {
    if (!customStart) {
      setCustomError('Selecione a data de início.');
      return;
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (customEnd > today) {
      setCustomError('A data de fim não pode ser posterior ao dia de hoje.');
      return;
    }
    if (customEnd < customStart) {
      setCustomError('A data de fim não pode ser anterior à data de início.');
      return;
    }
    setShowCustomModal(false);
    setSelectedPeriod('custom');
    setLoading(true);
    const startISO = customStart.toISOString().slice(0, 10);
    const endISO = customEnd.toISOString().slice(0, 10);
    const label = `${fmtDisplay(startISO)} — ${fmtDisplay(endISO)}`;
    fetchWithDates(startISO, endISO, label).finally(() => setLoading(false));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (selectedPeriod === 'custom' && customStart && customEnd) {
      const startISO = customStart.toISOString().slice(0, 10);
      const endISO = customEnd.toISOString().slice(0, 10);
      await fetchWithDates(startISO, endISO, `${fmtDisplay(startISO)} — ${fmtDisplay(endISO)}`);
    } else if (selectedPeriod !== 'custom') {
      await fetchAll(selectedPeriod);
    }
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchAll(selectedPeriod !== 'custom' ? selectedPeriod : '1m')}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const lotadas = lixeiras.filter((l) => l.statusCor === 'vermelho').length;
  const enchendo = lixeiras.filter((l) => l.statusCor === 'amarelo').length;

  return (
    <React.Fragment>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Condomínio</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
        }
      >
        <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>

        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodChip, selectedPeriod === p.key && styles.periodChipActive]}
              onPress={() => handlePeriodChange(p.key)}
            >
              <Text style={[styles.periodChipText, selectedPeriod === p.key && styles.periodChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryBadge, { borderColor: COLORS.error }]}>
            <Text style={[styles.summaryNum, { color: COLORS.error }]}>{lotadas}</Text>
            <Text style={styles.summaryLabel}>Lotada{lotadas !== 1 ? 's' : ''}</Text>
          </View>
          <View style={[styles.summaryBadge, { borderColor: COLORS.warning }]}>
            <Text style={[styles.summaryNum, { color: COLORS.warning }]}>{enchendo}</Text>
            <Text style={styles.summaryLabel}>Enchendo</Text>
          </View>
          <View style={[styles.summaryBadge, { borderColor: COLORS.success }]}>
            <Text style={[styles.summaryNum, { color: COLORS.success }]}>
              {lixeiras.length - lotadas - enchendo}
            </Text>
            <Text style={styles.summaryLabel}>Livre{lixeiras.length - lotadas - enchendo !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        {impacto && <ImpactoCard impacto={impacto} periodoLabel={periodoLabel} />}

        {lixeiras.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Status das lixeiras</Text>
            {lixeiras.map((l) => (
              <LixeiraCard key={l.sensorId} item={l} />
            ))}
          </>
        )}

        {coletas.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Últimas coletas</Text>
            <View style={styles.coletaList}>
              {coletas.map((c, i) => (
                <ColetaRow key={`${c.sensorId}-${i}`} item={c} />
              ))}
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>

    <Modal visible={showCustomModal} transparent animationType="fade" onRequestClose={() => setShowCustomModal(false)}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCustomModal(false)}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecionar Período</Text>
            <TouchableOpacity onPress={() => setShowCustomModal(false)}>
              <Ionicons name="close" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Data de início</Text>
          <TouchableOpacity style={styles.modalDateBtn} onPress={() => setShowStartPicker(true)}>
            <Text style={customStart ? styles.modalDateText : styles.modalDatePlaceholder}>
              {customStart ? fmtDisplay(customStart.toISOString().slice(0, 10)) : 'Selecionar data'}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={COLORS.text.secondary} />
          </TouchableOpacity>

          <Text style={styles.modalLabel}>Data de fim</Text>
          <TouchableOpacity style={styles.modalDateBtn} onPress={() => setShowEndPicker(true)}>
            <Text style={styles.modalDateText}>
              {fmtDisplay(customEnd.toISOString().slice(0, 10))}
            </Text>
            <Ionicons name="calendar-outline" size={18} color={COLORS.text.secondary} />
          </TouchableOpacity>

          {customError ? <Text style={styles.modalError}>{customError}</Text> : null}

          <TouchableOpacity style={styles.modalBtn} onPress={handleCustomApply}>
            <Text style={styles.modalBtnText}>Aplicar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>

    {showStartPicker && (
      <DateTimePicker
        value={customStart ?? new Date()}
        mode="date"
        display="default"
        maximumDate={customEnd}
        onChange={(event, date) => {
          setShowStartPicker(false);
          if (event.type === 'set' && date) {
            setCustomStart(date);
            setCustomError('');
          }
        }}
      />
    )}

    {showEndPicker && (
      <DateTimePicker
        value={customEnd}
        mode="date"
        display="default"
        maximumDate={new Date()}
        minimumDate={customStart ?? undefined}
        onChange={(event, date) => {
          setShowEndPicker(false);
          if (event.type === 'set' && date) {
            setCustomEnd(date);
            setCustomError('');
          }
        }}
      />
    )}
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  loadingText: { marginTop: SPACING.sm, color: COLORS.text.secondary },
  errorText: { marginTop: SPACING.sm, color: COLORS.error, textAlign: 'center' },
  retryBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: { color: '#fff', fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { padding: SPACING.xs },
  refreshBtn: { padding: SPACING.xs },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: SPACING.md },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  summaryBadge: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    paddingVertical: SPACING.sm,
    elevation: 1,
  },
  summaryNum: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: COLORS.text.secondary, marginTop: 2 },
  impactoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 1,
  },
  impactoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text.secondary,
    marginBottom: SPACING.sm,
  },
  impactoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  impactoItem: { alignItems: 'center', gap: 4 },
  impactoValue: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary },
  impactoLabel: { fontSize: 11, color: COLORS.text.secondary },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  lixeiraCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    elevation: 1,
  },
  lixeiraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 4,
  },
  lixeiraName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  statusBadge: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  lixeiraTipo: { fontSize: 12, color: COLORS.text.hint, marginBottom: SPACING.xs },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: 2,
  },
  barFill: { height: '100%', borderRadius: 4 },
  barLabel: { fontSize: 11, color: COLORS.text.secondary, textAlign: 'right' },
  coletaList: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    elevation: 1,
  },
  coletaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.sm,
  },
  coletaIcon: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coletaInfo: { flex: 1 },
  coletaNome: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary },
  coletaData: { fontSize: 12, color: COLORS.text.secondary },
  bottomSpacer: { height: SPACING.xl },
  periodRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  periodChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  periodChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  periodChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  periodChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalBox: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    padding: SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.sm,
  },
  modalDateBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalDateText: {
    fontSize: 16,
    color: COLORS.text.primary,
  },
  modalDatePlaceholder: {
    fontSize: 16,
    color: COLORS.text.secondary,
  },
  modalError: {
    marginTop: SPACING.sm,
    fontSize: 13,
    color: COLORS.error,
  },
  modalBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
