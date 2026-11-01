import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { OleoColetaModal } from '../components/OleoColetaModal';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import type { LixeiraAtencao, LixeiraColeta, PainelColetor } from '../types';

interface ColetorDashboardScreenProps {
  onBack: () => void;
}

const TIPO_OLEO = 8;
const ATUALIZAR_A_CADA_MS = 60_000;

// Mesmos limiares do backend e do dashboard de gestão
const levelColor = (nivel: number) => (nivel >= 90 ? COLORS.error : nivel >= 60 ? COLORS.warning : COLORS.primary);

// O backend devolve datas em UTC, às vezes sem o "Z" no fim
const parseUtc = (iso: string) => new Date(/Z|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);

const formatDuracao = (minutos: number) => {
  if (minutos < 60) return `${Math.max(1, Math.round(minutos))} min`;
  if (minutos < 48 * 60) return `${Math.round(minutos / 60)} h`;
  return `${Math.round(minutos / 1440)} dias`;
};

const haQuanto = (iso: string | null) =>
  iso ? `há ${formatDuracao((Date.now() - parseUtc(iso).getTime()) / 60000)}` : 'sem leituras';

const formatHora = (iso: string) =>
  parseUtc(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const abrirRota = (lat: number | null, lng: number | null) => {
  if (lat === null || lng === null) return;
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
};

const tipoIcon = (tipoId: number): keyof typeof MaterialCommunityIcons.glyphMap =>
  tipoId === TIPO_OLEO ? 'water' : tipoId === 1 ? 'leaf' : tipoId === 7 ? 'trash-can' : 'recycle';


const ResumoCard: React.FC<{ valor: number | string; label: string; cor: string }> = ({ valor, label, cor }) => (
  <View style={styles.resumoCard}>
    <Text style={[styles.resumoValor, { color: cor }]}>{valor}</Text>
    <Text style={styles.resumoLabel}>{label}</Text>
  </View>
);


const SectionTitle: React.FC<{ icon: keyof typeof Ionicons.glyphMap; title: string; count?: number; color: string }> = ({
  icon,
  title,
  count,
  color,
}) => (
  <View style={styles.sectionHeader}>
    <Ionicons name={icon} size={18} color={color} />
    <Text style={styles.sectionTitle}>{title}</Text>
    {count !== undefined && count > 0 && (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    )}
  </View>
);


const ColetaCard: React.FC<{ item: LixeiraColeta; onRegistrarOleo: (sensorId: number) => void }> = ({ item, onRegistrarOleo }) => {
  const cor = levelColor(item.nivelAtual);
  const ehOleo = item.tipoId === TIPO_OLEO;
  return (
    <View style={[styles.card, { borderLeftColor: cor }]}>
      <View style={styles.cardTop}>
        <View style={[styles.tipoIcon, { backgroundColor: `${cor}1A` }]}>
          <MaterialCommunityIcons name={tipoIcon(item.tipoId)} size={22} color={cor} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardNome} numberOfLines={1}>{item.nomeSensor}</Text>
          <Text style={styles.cardSub}>
            {item.tipo}
            {item.lotado && item.cheioDesde ? ` · cheia ${haQuanto(item.cheioDesde)}` : ''}
          </Text>
        </View>
        <Text style={[styles.cardNivel, { color: cor }]}>{item.nivelAtual}%</Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, item.nivelAtual)}%`, backgroundColor: cor }]} />
      </View>

      {ehOleo && item.litrosAtuais !== null && item.capacidadeLitros !== null && (
        <Text style={styles.cardHint}>
          {item.litrosAtuais.toLocaleString('pt-BR')} de {item.capacidadeLitros.toLocaleString('pt-BR')} litros
        </Text>
      )}
      {item.offline && (
        <Text style={[styles.cardHint, { color: COLORS.accent }]}>
          Sem sinal · última leitura {haQuanto(item.ultimaLeitura)}
        </Text>
      )}

      <View style={styles.cardActions}>
        {item.latitude !== null && item.longitude !== null && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => abrirRota(item.latitude, item.longitude)}>
            <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
            <Text style={styles.actionText}>Como chegar</Text>
          </TouchableOpacity>
        )}
        {ehOleo && (
          <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={() => onRegistrarOleo(item.sensorId)}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.text.white} />
            <Text style={[styles.actionText, { color: COLORS.text.white }]}>Registrar coleta</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};


const PrevisaoRow: React.FC<{ item: LixeiraColeta }> = ({ item }) => {
  const minutos = item.previsaoCheia ? (parseUtc(item.previsaoCheia).getTime() - Date.now()) / 60000 : null;
  return (
    <TouchableOpacity style={styles.row} onPress={() => abrirRota(item.latitude, item.longitude)} activeOpacity={0.7}>
      <MaterialCommunityIcons name={tipoIcon(item.tipoId)} size={20} color={COLORS.text.secondary} />
      <View style={styles.rowInfo}>
        <Text style={styles.rowNome} numberOfLines={1}>{item.nomeSensor}</Text>
        <Text style={styles.rowSub}>{item.tipo} · agora {item.nivelAtual}%</Text>
      </View>
      {item.previsaoCheia && minutos !== null && (
        <View style={styles.rowRight}>
          <Text style={styles.rowDestaque}>~{formatDuracao(Math.max(minutos, 0))}</Text>
          <Text style={styles.rowSub}>às {formatHora(item.previsaoCheia)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};


const AtencaoRow: React.FC<{ item: LixeiraAtencao }> = ({ item }) => {
  const semSinal = item.motivo !== 'Bateria baixa';
  return (
    <TouchableOpacity style={styles.row} onPress={() => abrirRota(item.latitude, item.longitude)} activeOpacity={0.7}>
      <Ionicons
        name={semSinal ? 'cloud-offline-outline' : 'battery-dead-outline'}
        size={20}
        color={semSinal ? COLORS.warning : COLORS.error}
      />
      <View style={styles.rowInfo}>
        <Text style={styles.rowNome} numberOfLines={1}>{item.nomeSensor}</Text>
        <Text style={styles.rowSub}>
          {item.motivo}
          {item.bateria !== null ? ` · bateria ${item.bateria}%` : ''}
          {semSinal && item.ultimaLeitura ? ` · ${haQuanto(item.ultimaLeitura)}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
};


export const ColetorDashboardScreen: React.FC<ColetorDashboardScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const condominioId = user?.condominiumId ?? 0;

  const [painel, setPainel] = useState<PainelColetor | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oleoSensorId, setOleoSensorId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    if (!condominioId) {
      setLoading(false);
      return;
    }
    try {
      setError(null);
      setPainel(await dashboardService.getPainelColetor(condominioId));
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar o painel.');
    } finally {
      setLoading(false);
    }
  }, [condominioId]);

  // O coletor deixa a tela aberta durante a ronda; atualiza sozinho
  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, ATUALIZAR_A_CADA_MS);
    return () => clearInterval(timer);
  }, [carregar]);

  const onRefresh = async () => {
    setRefreshing(true);
    await carregar();
    setRefreshing(false);
  };

  const recipientesOleo = (painel?.paraRecolher ?? [])
    .filter((i) => i.tipoId === TIPO_OLEO)
    .map((i) => ({ sensorId: i.sensorId, nomeSensor: i.nomeSensor, litrosAtuais: i.litrosAtuais }));

  const renderConteudo = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      );
    }
    if (!condominioId) {
      return (
        <View style={styles.center}>
          <MaterialCommunityIcons name="office-building-outline" size={48} color={COLORS.text.disabled} />
          <Text style={styles.emptyText}>Nenhum condomínio associado à sua conta.</Text>
        </View>
      );
    }
    if (error || !painel) {
      return (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={carregar}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const lotadas = painel.paraRecolher.filter((i) => i.lotado).length;

    return (
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        <View style={styles.resumoRow}>
          <ResumoCard valor={lotadas} label="Lotadas" cor={lotadas > 0 ? COLORS.error : COLORS.text.secondary} />
          <ResumoCard valor={painel.coletasHoje} label="Coletas hoje" cor={COLORS.primary} />
          <ResumoCard valor={painel.coletasSemana} label="Na semana" cor={COLORS.primary} />
        </View>

        <SectionTitle icon="alert-circle" title="Para recolher agora" count={painel.paraRecolher.length} color={COLORS.error} />
        {painel.paraRecolher.length > 0 ? (
          painel.paraRecolher.map((item) => (
            <ColetaCard key={item.sensorId} item={item} onRegistrarOleo={setOleoSensorId} />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={28} color={COLORS.primary} />
            <Text style={styles.emptyCardText}>Tudo em dia. Nenhuma lixeira passou de 60%.</Text>
          </View>
        )}

        <SectionTitle icon="time-outline" title="Vão encher nas próximas 24 h" color={COLORS.warning} />
        {painel.enchemEmBreve.length > 0 ? (
          <View style={styles.listCard}>
            {painel.enchemEmBreve.map((item) => <PrevisaoRow key={item.sensorId} item={item} />)}
          </View>
        ) : (
          <Text style={styles.sectionEmpty}>Nenhuma prevista. A previsão usa o ritmo de enchimento dos últimos 7 dias.</Text>
        )}

        {painel.atencao.length > 0 && (
          <>
            <SectionTitle icon="construct-outline" title="Precisam de atenção" count={painel.atencao.length} color={COLORS.warning} />
            <View style={styles.listCard}>
              {painel.atencao.map((item) => <AtencaoRow key={item.sensorId} item={item} />)}
            </View>
          </>
        )}

        <Text style={styles.footer}>
          {painel.litrosOleoSemana > 0
            ? `${painel.litrosOleoSemana.toLocaleString('pt-BR')} L de óleo destinados na semana · `
            : ''}
          Atualizado às {formatHora(painel.atualizadoEm)}
        </Text>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Painel do coletor</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
          <Ionicons name="refresh" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {renderConteudo()}

      {!!condominioId && (
        <OleoColetaModal
          visible={oleoSensorId !== null}
          condominioId={condominioId}
          recipientes={recipientesOleo}
          sensorIdInicial={oleoSensorId ?? undefined}
          onClose={() => setOleoSensorId(null)}
          onSaved={() => {
            setOleoSensorId(null);
            carregar();
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBtn: { padding: SPACING.xs },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: COLORS.text.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg, gap: SPACING.sm },
  emptyText: { color: COLORS.text.secondary, textAlign: 'center', fontSize: 14 },
  retryBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: { color: COLORS.text.white, fontWeight: '600' },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  resumoRow: { flexDirection: 'row', gap: SPACING.sm },
  resumoCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    elevation: 1,
  },
  resumoValor: { fontSize: 24, fontWeight: '800' },
  resumoLabel: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary },
  sectionEmpty: { fontSize: 13, color: COLORS.text.secondary },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: COLORS.text.white, fontSize: 12, fontWeight: '700' },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  tipoIcon: { width: 40, height: 40, borderRadius: BORDER_RADIUS.round, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: 15, fontWeight: '700', color: COLORS.text.primary },
  cardSub: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  cardNivel: { fontSize: 22, fontWeight: '800' },
  cardHint: { fontSize: 12, color: COLORS.text.secondary, marginTop: SPACING.xs },
  track: {
    height: 8,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
    marginTop: SPACING.sm,
  },
  fill: { height: '100%', borderRadius: BORDER_RADIUS.round },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionBtnPrimary: { backgroundColor: COLORS.primary },
  actionText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    elevation: 1,
  },
  emptyCardText: { flex: 1, fontSize: 14, color: COLORS.text.primary },
  listCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rowInfo: { flex: 1 },
  rowNome: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary },
  rowSub: { fontSize: 12, color: COLORS.text.secondary, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowDestaque: { fontSize: 14, fontWeight: '700', color: COLORS.accent },
  footer: { textAlign: 'center', fontSize: 12, color: COLORS.text.secondary, marginTop: SPACING.lg },
});
