import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { condominiumService, type Condominium } from '../services/condominiumService';
import { KeyboardAvoider } from '../components/KeyboardAvoider';
import { OleoColetaModal } from '../components/OleoColetaModal';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';
import type { DashboardAlertas, EnergiaSolar, EvolucaoMensal, ImpactoAmbiental, OleoResumo, RankingItem, UsoDiaSemana, VolumeReciclavel, Economia } from '../types';

interface DashboardScreenProps {
  onBack: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
// Largura útil dentro do chartCard (margem da tela + padding do card)
const CHART_WIDTH = SCREEN_WIDTH - SPACING.md * 2 - SPACING.sm * 2;

// Mesmos limiares usados na lista de lixeiras e no backend (LimiarCheio = 90)
const LIMIAR_CHEIO = 90;
const LIMIAR_ATENCAO = 60;

const occupancyColor = (value: number) =>
  value >= LIMIAR_CHEIO ? COLORS.error : value >= LIMIAR_ATENCAO ? COLORS.warning : COLORS.primary;

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const chartConfig = {
  backgroundColor: COLORS.surface,
  backgroundGradientFrom: COLORS.surface,
  backgroundGradientTo: COLORS.surface,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
  labelColor: () => COLORS.text.secondary,
  style: { borderRadius: BORDER_RADIUS.md },
  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
  propsForBackgroundLines: { stroke: COLORS.border, strokeDasharray: '' },
};


interface KpiCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, icon, color = COLORS.primary }) => (
  <View style={[styles.kpiCard, { borderLeftColor: color }]}>
    <View style={[styles.kpiIcon, { backgroundColor: `${color}18` }]}>{icon}</View>
    <View style={styles.kpiText}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  </View>
);


const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
  </View>
);


const ChartEmpty: React.FC<{ message?: string }> = ({ message = 'Sem leituras no período selecionado.' }) => (
  <View style={styles.chartEmpty}>
    <MaterialCommunityIcons name="chart-box-outline" size={28} color={COLORS.text.disabled} />
    <Text style={styles.chartEmptyText}>{message}</Text>
  </View>
);


const OccupancyLegend: React.FC = () => (
  <View style={styles.legendRow}>
    {[
      { color: COLORS.primary, label: `< ${LIMIAR_ATENCAO}%` },
      { color: COLORS.warning, label: `${LIMIAR_ATENCAO}–${LIMIAR_CHEIO - 1}%` },
      { color: COLORS.error, label: `≥ ${LIMIAR_CHEIO}%` },
    ].map((item) => (
      <View key={item.label} style={styles.legendItem}>
        <View style={[styles.legendSwatch, { backgroundColor: item.color }]} />
        <Text style={styles.legendText}>{item.label}</Text>
      </View>
    ))}
  </View>
);


interface RankingBarsProps {
  items: RankingItem[];
}

const RankingBars: React.FC<RankingBarsProps> = ({ items }) => (
  <View>
    {items.map((item, index) => {
      const value = clampPercent(item.mediaOcupacao);
      return (
        <View key={item.sensorId} style={styles.rankRow}>
          <Text style={styles.rankPos}>{index + 1}</Text>
          <View style={styles.rankBody}>
            <View style={styles.rankHeader}>
              <Text style={styles.rankName} numberOfLines={1}>{item.nomeSensor}</Text>
              <Text style={styles.rankValue}>{value.toFixed(0)}%</Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${value}%`, backgroundColor: occupancyColor(value) }]} />
            </View>
          </View>
        </View>
      );
    })}
  </View>
);


interface VerticalBarItem {
  key: string | number;
  label: string;
  value: number;
  valueLabel?: string;
  color: string;
}

const VerticalBars: React.FC<{ items: VerticalBarItem[]; max: number; height?: number; barWidth?: number }> = ({
  items,
  max,
  height = 120,
  barWidth = 22,
}) => (
  <View style={styles.weekRow}>
    {items.map((item) => (
      <View key={item.key} style={styles.weekCol}>
        {item.valueLabel !== undefined && <Text style={styles.weekValue}>{item.valueLabel}</Text>}
        <View style={[styles.weekTrack, { height, width: barWidth }]}>
          <View
            style={[
              styles.weekFill,
              { height: max > 0 ? (Math.min(item.value, max) / max) * height : 0, backgroundColor: item.color },
            ]}
          />
        </View>
        <Text style={styles.weekLabel}>{item.label}</Text>
      </View>
    ))}
  </View>
);

const WeekdayBars: React.FC<{ items: UsoDiaSemana[] }> = ({ items }) => (
  <VerticalBars
    max={100}
    items={[...items]
      .sort((a, b) => a.numeroDia - b.numeroDia)
      .map((d) => {
        const value = clampPercent(d.mediaOcupacao);
        return {
          key: d.numeroDia,
          label: d.diaSemana.slice(0, 3),
          value,
          valueLabel: `${value.toFixed(0)}%`,
          color: occupancyColor(value),
        };
      })}
  />
);


const SOLAR_COLOR = COLORS.accent;
const OLEO_COLOR = COLORS.secondary;

const batteryColor = (value: number) =>
  value < 20 ? COLORS.error : value < 50 ? COLORS.warning : COLORS.primary;

const formatLitros = (litros: number) => {
  if (litros >= 1_000_000) return `${(litros / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi L`;
  if (litros >= 1_000) return `${(litros / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil L`;
  return `${litros.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} L`;
};

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });


const SolarSection: React.FC<{ data: EnergiaSolar }> = ({ data }) => {
  // Preenche as 24 horas para a curva não "pular" horas sem leitura
  const horas = Array.from({ length: 24 }, (_, h) => data.porHora.find((p) => p.hora === h));
  return (
    <>
      <View style={styles.kpiRow}>
        <KpiCard
          label="Bateria média"
          value={data.bateriaMedia !== null ? `${data.bateriaMedia.toFixed(0)}%` : '—'}
          color={data.bateriaMedia !== null ? batteryColor(data.bateriaMedia) : COLORS.text.disabled}
          icon={<Ionicons name="battery-half-outline" size={22} color={data.bateriaMedia !== null ? batteryColor(data.bateriaMedia) : COLORS.text.disabled} />}
        />
        <KpiCard
          label="Carregando agora"
          value={`${data.sensoresCarregandoAgora}/${data.totalSensores}`}
          color={SOLAR_COLOR}
          icon={<Ionicons name="sunny-outline" size={22} color={SOLAR_COLOR} />}
        />
      </View>
      <View style={styles.kpiRow}>
        <KpiCard
          label="Carga solar por dia"
          value={`${data.horasCargaPorDia.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} h`}
          color={SOLAR_COLOR}
          icon={<Ionicons name="time-outline" size={22} color={SOLAR_COLOR} />}
        />
        {data.possuiMedicaoCorrente && data.energiaGeradaWh !== null ? (
          <KpiCard
            label="Energia gerada"
            value={`${data.energiaGeradaWh.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} Wh`}
            color={SOLAR_COLOR}
            icon={<Ionicons name="flash-outline" size={22} color={SOLAR_COLOR} />}
          />
        ) : (
          <KpiCard
            label="Tempo carregando"
            value={`${data.percentualTempoCarregando.toFixed(0)}%`}
            color={SOLAR_COLOR}
            icon={<Ionicons name="flash-outline" size={22} color={SOLAR_COLOR} />}
          />
        )}
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.cardSubtitle}>% das leituras com o painel carregando, por hora do dia</Text>
        <VerticalBars
          max={100}
          height={90}
          barWidth={8}
          items={horas.map((p, h) => ({
            key: h,
            label: h % 6 === 0 ? `${h}h` : '',
            value: p?.percentualCarregando ?? 0,
            color: SOLAR_COLOR,
          }))}
        />
      </View>

      <View style={styles.chartCard}>
        {data.sensores.map((s) => {
          const bateria = s.bateriaAtual;
          return (
            <View key={s.sensorId} style={styles.rankRow}>
              <Ionicons
                name={s.carregando ? 'sunny' : 'moon-outline'}
                size={16}
                color={s.carregando ? SOLAR_COLOR : COLORS.text.secondary}
              />
              <View style={styles.rankBody}>
                <View style={styles.rankHeader}>
                  <Text style={styles.rankName} numberOfLines={1}>{s.nomeSensor}</Text>
                  <Text style={styles.rankValue}>
                    {bateria !== null ? `${bateria}%` : s.tensaoBateria !== null ? `${s.tensaoBateria.toFixed(2)} V` : '—'}
                  </Text>
                </View>
                {bateria !== null && (
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${clampPercent(bateria)}%`, backgroundColor: batteryColor(bateria) }]} />
                  </View>
                )}
                {s.autonomiaHoras !== null && (
                  <Text style={styles.rowHint}>Autonomia sem sol: ~{s.autonomiaHoras.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} h</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </>
  );
};


const OleoSection: React.FC<{ data: OleoResumo; canRegister: boolean; onRegister: () => void }> = ({
  data,
  canRegister,
  onRegister,
}) => {
  const maxMes = Math.max(0, ...data.porMes.map((m) => m.litros));
  return (
    <>
      <View style={styles.kpiRow}>
        <KpiCard
          label="Coletados no período"
          value={formatLitros(data.litrosColetadosPeriodo)}
          color={OLEO_COLOR}
          icon={<Ionicons name="water-outline" size={22} color={OLEO_COLOR} />}
        />
        <KpiCard
          label="Armazenado agora"
          value={formatLitros(data.litrosArmazenadosAgora)}
          color={OLEO_COLOR}
          icon={<MaterialCommunityIcons name="bottle-tonic-outline" size={22} color={OLEO_COLOR} />}
        />
      </View>
      {data.aguaPreservadaLitros > 0 && (
        <View style={styles.kpiRow}>
          <KpiCard
            label="Água protegida (estimativa: 1 L de óleo ≈ 25 mil L de água)"
            value={formatLitros(data.aguaPreservadaLitros)}
            color={COLORS.info}
            icon={<MaterialCommunityIcons name="waves" size={22} color={COLORS.info} />}
          />
        </View>
      )}

      {data.recipientes.length > 0 && (
        <View style={styles.chartCard}>
          {data.recipientes.map((r) => {
            const nivel = r.nivelAtual !== null ? clampPercent(r.nivelAtual) : null;
            return (
              <View key={r.sensorId} style={styles.rankRow}>
                <Ionicons name="water" size={16} color={OLEO_COLOR} />
                <View style={styles.rankBody}>
                  <View style={styles.rankHeader}>
                    <Text style={styles.rankName} numberOfLines={1}>{r.nomeSensor}</Text>
                    <Text style={styles.rankValue}>
                      {r.litrosAtuais !== null && r.capacidadeLitros !== null
                        ? `${r.litrosAtuais.toLocaleString('pt-BR')} / ${r.capacidadeLitros.toLocaleString('pt-BR')} L`
                        : nivel !== null ? `${nivel.toFixed(0)}%` : '—'}
                    </Text>
                  </View>
                  {nivel !== null && (
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${nivel}%`, backgroundColor: occupancyColor(nivel) }]} />
                    </View>
                  )}
                  {r.cheio && <Text style={[styles.rowHint, { color: COLORS.error }]}>Recipiente cheio · agendar coleta</Text>}
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.chartCard}>
        <Text style={styles.cardSubtitle}>Litros destinados por mês</Text>
        {maxMes > 0 ? (
          <VerticalBars
            max={maxMes}
            height={90}
            items={data.porMes.map((m) => ({
              key: `${m.ano}-${m.mes}`,
              label: m.mesNome.slice(0, 3),
              value: m.litros,
              valueLabel: m.litros > 0 ? m.litros.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '',
              color: OLEO_COLOR,
            }))}
          />
        ) : (
          <ChartEmpty message="Nenhuma coleta de óleo registrada nos últimos meses." />
        )}
      </View>

      {data.ultimasColetas.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.cardSubtitle}>Últimas coletas</Text>
          {data.ultimasColetas.map((c) => (
            <View key={c.id} style={styles.coletaRow}>
              <Text style={styles.coletaDate}>{formatShortDate(c.dataColeta)}</Text>
              <View style={styles.rankBody}>
                <Text style={styles.rankName} numberOfLines={1}>{c.destino || 'Destino não informado'}</Text>
                {c.registradoPor && <Text style={styles.rowHint}>por {c.registradoPor}</Text>}
              </View>
              <Text style={styles.rankValue}>{c.litros.toLocaleString('pt-BR')} L</Text>
            </View>
          ))}
        </View>
      )}

      {canRegister && (
        <TouchableOpacity style={styles.primaryBtn} onPress={onRegister}>
          <Ionicons name="add-circle-outline" size={18} color={COLORS.text.white} />
          <Text style={styles.primaryBtnText}>Registrar coleta de óleo</Text>
        </TouchableOpacity>
      )}
    </>
  );
};




const RecyclableSplit: React.FC<{ data: VolumeReciclavel }> = ({ data }) => {
  const pct = clampPercent(data.percentualReciclavel);
  return (
    <View>
      <View style={styles.splitHeadline}>
        <Text style={styles.splitValue}>{pct.toFixed(0)}%</Text>
        <Text style={styles.splitCaption}>das leituras vieram de lixeiras recicláveis</Text>
      </View>
      <View style={styles.splitTrack}>
        <View style={{ flex: data.leiturasReciclavel, backgroundColor: COLORS.primary }} />
        <View style={{ flex: data.leiturasLixoComum, backgroundColor: COLORS.text.hint }} />
      </View>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: COLORS.primary }]} />
          <Text style={styles.legendText}>Reciclável · {data.leiturasReciclavel} leituras</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: COLORS.text.hint }]} />
          <Text style={styles.legendText}>Comum · {data.leiturasLixoComum} leituras</Text>
        </View>
      </View>
    </View>
  );
};


export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onBack }) => {
  const { user, hasPermission } = useAuth();
  const isAdmin = hasPermission(['admin']);
  const insets = useSafeAreaInsets();
  const canRegisterOleo = hasPermission(['admin', 'sindico', 'coletor']);

  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondominiumId, setSelectedCondominiumId] = useState<number | null>(null);
  const [showCondominiumModal, setShowCondominiumModal] = useState(false);
  const [condominiumSearch, setCondominiumSearch] = useState('');

  const condominioId = isAdmin ? (selectedCondominiumId ?? 0) : (user?.condominiumId ?? 0);

  const selectedCondominiumName = condominiums.find((c) => c.id === selectedCondominiumId)?.nome ?? 'Selecionar condomínio';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [alertas, setAlertas] = useState<DashboardAlertas | null>(null);
  const [impacto, setImpacto] = useState<ImpactoAmbiental | null>(null);
  const [economia, setEconomia] = useState<Economia | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [usoDia, setUsoDia] = useState<UsoDiaSemana[]>([]);
  const [evolucao, setEvolucao] = useState<EvolucaoMensal[]>([]);
  const [reciclavel, setReciclavel] = useState<VolumeReciclavel | null>(null);
  const [energia, setEnergia] = useState<EnergiaSolar | null>(null);
  const [oleo, setOleo] = useState<OleoResumo | null>(null);
  const [showOleoModal, setShowOleoModal] = useState(false);

  const [dateFrom, setDateFrom] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    condominiumService.getAll().then((res) => {
      if (res?.dados?.length) {
        setCondominiums(res.dados);
        setSelectedCondominiumId((prev) => prev ?? res.dados![0].id);
      }
    }).catch(console.error);
  }, [isAdmin]);

  const fetchAll = useCallback(async () => {
    if (!condominioId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setError(null);
      const filter = {
        dataInicio: dateFrom.toISOString(),
        dataFim: dateTo.toISOString(),
      };
      const [geral, rec] = await Promise.all([
        dashboardService.getDashboardGeral(condominioId, filter),
        dashboardService.getReciclavel(condominioId, filter),
      ]);
      setAlertas(geral.alertas);
      setImpacto(geral.impactoAmbiental);
      setEconomia(geral.economia);
      setRanking(geral.rankingLixeiras);
      setUsoDia(geral.usoPorDiaSemana);
      setEvolucao(geral.evolucaoMensal);
      setEnergia(geral.energiaSolar ?? null);
      setOleo(geral.oleo ?? null);
      setReciclavel(rec);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar dashboard.');
    } finally {
      setLoading(false);
    }
  }, [condominioId, dateFrom, dateTo]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Carregando dashboard…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchAll}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const LINE_ITEM_WIDTH = 56;

  const evolucaoChartWidth = Math.max(CHART_WIDTH, evolucao.length * LINE_ITEM_WIDTH);
  const evolucaoData = evolucao.length > 0
    ? {
        labels: evolucao.map((e) => e.mesNome.slice(0, 3)),
        datasets: [
          { data: evolucao.map((e) => clampPercent(e.mediaOcupacaoGeral)) },
          // Série invisível que fixa o eixo Y em 0–100%
          { data: [100], withDots: false, color: () => 'transparent' },
        ],
      }
    : null;

  const rankingSlice = ranking.slice(0, 10);
  const hasUsoDia = usoDia.some((d) => d.mediaOcupacao > 0);
  const hasReciclavel = !!reciclavel && reciclavel.totalLeituras > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="dark" />

      {isAdmin && (
        <Modal visible={showCondominiumModal} transparent animationType="slide">
          <KeyboardAvoider>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: SPACING.md + insets.bottom }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecionar condomínio</Text>
                <TouchableOpacity onPress={() => setShowCondominiumModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.text.primary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar condomínio..."
                placeholderTextColor={COLORS.text.secondary}
                value={condominiumSearch}
                onChangeText={setCondominiumSearch}
              />
              <FlatList
                data={condominiums.filter((c) =>
                  c.nome.toLowerCase().includes(condominiumSearch.toLowerCase()),
                )}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.condoItem,
                      item.id === selectedCondominiumId && styles.condoItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedCondominiumId(item.id);
                      setShowCondominiumModal(false);
                      setCondominiumSearch('');
                    }}
                  >
                    <Text
                      style={[
                        styles.condoItemText,
                        item.id === selectedCondominiumId && styles.condoItemTextSelected,
                      ]}
                    >
                      {item.nome}
                    </Text>
                    {item.id === selectedCondominiumId && (
                      <Ionicons name="checkmark" size={18} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
          </KeyboardAvoider>
        </Modal>
      )}

      {!!condominioId && (
        <OleoColetaModal
          visible={showOleoModal}
          condominioId={condominioId}
          recipientes={oleo?.recipientes ?? []}
          onClose={() => setShowOleoModal(false)}
          onSaved={() => {
            setShowOleoModal(false);
            fetchAll();
          }}
        />
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {isAdmin && (
        <TouchableOpacity
          style={styles.condoFilterBar}
          onPress={() => setShowCondominiumModal(true)}
        >
          <Ionicons name="business-outline" size={16} color={COLORS.primary} />
          <Text style={styles.condoFilterText} numberOfLines={1}>
            {selectedCondominiumName}
          </Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.text.secondary} />
        </TouchableOpacity>
      )}

      <View style={styles.dateFilterBar}>
        <Ionicons name="calendar-outline" size={15} color={COLORS.text.secondary} />
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowFromPicker(true)}>
          <Text style={styles.dateBtnText}>{formatDate(dateFrom)}</Text>
        </TouchableOpacity>
        <Text style={styles.dateSep}>→</Text>
        <TouchableOpacity style={styles.dateBtn} onPress={() => setShowToPicker(true)}>
          <Text style={styles.dateBtnText}>{formatDate(dateTo)}</Text>
        </TouchableOpacity>
      </View>

      {showFromPicker && (
        <DateTimePicker
          value={dateFrom}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          maximumDate={dateTo}
          onChange={(_event: DateTimePickerEvent, date?: Date) => {
            setShowFromPicker(false);
            if (date) setDateFrom(date);
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={dateTo}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          minimumDate={dateFrom}
          maximumDate={new Date()}
          onChange={(_event: DateTimePickerEvent, date?: Date) => {
            setShowToPicker(false);
            if (date) setDateTo(date);
          }}
        />
      )}

      {!condominioId ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="office-building-outline" size={48} color={COLORS.text.disabled} />
          <Text style={styles.emptyText}>
            {isAdmin ? 'Selecione um condomínio para ver os dados.' : 'Nenhum condomínio associado à sua conta.'}
          </Text>
        </View>
      ) : (

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {alertas && (
          <>
            <SectionHeader title="Status atual" />
            <View style={styles.kpiRow}>
              <KpiCard
                label="Lotadas agora"
                value={String(alertas.sensoresLotadosAgora)}
                color={COLORS.error}
                icon={<MaterialCommunityIcons name="delete-alert" size={22} color={COLORS.error} />}
              />
              <KpiCard
                label="Offline"
                value={String(alertas.sensoresOffline)}
                color={COLORS.warning}
                icon={<Ionicons name="wifi-outline" size={22} color={COLORS.warning} />}
              />
            </View>
            <View style={styles.kpiRow}>
              <KpiCard
                label="Alertas · últimos 30 dias"
                value={String(alertas.totalAlertasCheio)}
                color={COLORS.secondary}
                icon={<Ionicons name="notifications-outline" size={22} color={COLORS.secondary} />}
              />
            </View>
          </>
        )}

        {/* {impacto && (
          <>
            <SectionHeader title="Impacto ambiental" />
            <View style={styles.kpiRow}>
              <KpiCard
                label="kg reciclados"
                value={`${impacto.kgReciclados.toFixed(1)} kg`}
                color={COLORS.primary}
                icon={<MaterialCommunityIcons name="recycle" size={22} color={COLORS.primary} />}
              />
              <KpiCard
                label="CO₂ evitado"
                value={`${impacto.co2Evitado.toFixed(1)} kg`}
                color={COLORS.info}
                icon={<MaterialCommunityIcons name="leaf" size={22} color={COLORS.info} />}
              />
            </View>
            <View style={styles.kpiRow}>
              <KpiCard
                label="Árvores salvas"
                value={impacto.arvoresSalvas.toFixed(2)}
                color={COLORS.success}
                icon={<MaterialCommunityIcons name="tree" size={22} color={COLORS.success} />}
              />
              <KpiCard
                label="Total de coletas"
                value={String(impacto.totalColetas)}
                color={COLORS.accent}
                icon={<MaterialCommunityIcons name="truck-outline" size={22} color={COLORS.accent} />}
              />
            </View>
          </>
        )}
        */}

        <SectionHeader title="Reciclável vs lixo comum" subtitle="Proporção das leituras no período" />
        <View style={styles.chartCard}>
          {hasReciclavel ? <RecyclableSplit data={reciclavel!} /> : <ChartEmpty />}
        </View>

        <SectionHeader
          title="Ranking · lixeiras mais cheias"
          subtitle="Ocupação média no período (top 10)"
        />
        <View style={styles.chartCard}>
          {rankingSlice.length > 0 ? (
            <>
              <RankingBars items={rankingSlice} />
              <OccupancyLegend />
            </>
          ) : (
            <ChartEmpty />
          )}
        </View>

        <SectionHeader title="Ocupação por dia da semana" subtitle="Média no período" />
        <View style={styles.chartCard}>
          {hasUsoDia ? <WeekdayBars items={usoDia} /> : <ChartEmpty />}
        </View>

        <SectionHeader
          title="Evolução mensal · ocupação média"
          subtitle="Últimos meses (não segue o filtro de datas)"
        />
        <View style={styles.chartCard}>
          {evolucaoData ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={evolucaoData}
                width={evolucaoChartWidth}
                height={200}
                chartConfig={chartConfig}
                fromZero
                segments={4}
                yAxisSuffix="%"
                withShadow={false}
                withVerticalLines={false}
                style={styles.chart}
              />
            </ScrollView>
          ) : (
            <ChartEmpty message="Ainda não há meses com leituras." />
          )}
        </View>

        <SectionHeader title="Energia solar" subtitle="Bateria e carga dos painéis no período" />
        {energia?.possuiDados ? (
          <SolarSection data={energia} />
        ) : (
          <View style={styles.chartCard}>
            <ChartEmpty message="Nenhuma lixeira enviou dados de bateria ou painel no período." />
          </View>
        )}

        <SectionHeader title="Óleo de cozinha" subtitle="Recipientes e coletas destinadas corretamente" />
        {oleo && (oleo.recipientes.length > 0 || oleo.porMes.some((m) => m.litros > 0)) ? (
          <OleoSection data={oleo} canRegister={canRegisterOleo} onRegister={() => setShowOleoModal(true)} />
        ) : (
          <View style={styles.chartCard}>
            <ChartEmpty message="Nenhum recipiente de óleo cadastrado. Cadastre um sensor do tipo “Óleo de cozinha”." />
            {canRegisterOleo && (
              <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowOleoModal(true)}>
                <Text style={styles.secondaryBtnText}>Registrar coleta mesmo assim</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {alertas && alertas.detalhes.length > 0 && (
          <>
            <SectionHeader title="Detalhes das lixeiras" />
            {alertas.detalhes.map((d) => (
              <View key={d.sensorId} style={styles.alertRow}>
                <View
                  style={[
                    styles.alertDot,
                    {
                      backgroundColor: d.offline
                        ? COLORS.text.disabled
                        : d.lotado
                        ? COLORS.error
                        : d.nivelAtual >= 60
                        ? COLORS.warning
                        : COLORS.success,
                    },
                  ]}
                />
                <View style={styles.alertInfo}>
                  <Text style={styles.alertName}>{d.nomeSensor}</Text>
                  <Text style={styles.alertSub}>
                    {d.offline ? 'Offline' : `${d.nivelAtual}% — ${d.lotado ? 'Lotada' : 'Normal'}`}
                  </Text>
                </View>
                <Text style={styles.alertLevel}>{d.offline ? '—' : `${d.nivelAtual}%`}</Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
      )}
    </SafeAreaView>
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
  sectionHeader: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  kpiCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderLeftWidth: 4,
    gap: SPACING.sm,
    elevation: 1,
  },
  kpiIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiText: { flex: 1 },
  kpiValue: { fontSize: 16, fontWeight: '800', color: COLORS.text.primary },
  kpiLabel: { fontSize: 11, color: COLORS.text.secondary, marginTop: 2 },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    elevation: 1,
    overflow: 'hidden',
  },
  chart: { borderRadius: BORDER_RADIUS.md },
  chartEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.xs,
  },
  chartEmptyText: { fontSize: 13, color: COLORS.text.secondary, textAlign: 'center' },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 12, color: COLORS.text.secondary },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 6,
  },
  rankPos: {
    width: 18,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text.secondary,
    textAlign: 'right',
  },
  rankBody: { flex: 1 },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginBottom: 4,
  },
  rankName: { flex: 1, fontSize: 13, color: COLORS.text.primary },
  rankValue: { fontSize: 13, fontWeight: '700', color: COLORS.text.primary },
  track: {
    height: 8,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.background,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: BORDER_RADIUS.round },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.xs,
  },
  weekCol: { flex: 1, alignItems: 'center' },
  weekValue: { fontSize: 11, fontWeight: '700', color: COLORS.text.primary, marginBottom: 4 },
  weekTrack: {
    width: 22,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekFill: { width: '100%', borderRadius: BORDER_RADIUS.sm },
  weekLabel: { fontSize: 11, color: COLORS.text.secondary, marginTop: 6 },
  splitHeadline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  splitValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  splitCaption: { flex: 1, fontSize: 13, color: COLORS.text.secondary },
  splitTrack: {
    flexDirection: 'row',
    height: 12,
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    backgroundColor: COLORS.background,
    gap: 2,
  },
  cardSubtitle: { fontSize: 12, color: COLORS.text.secondary, marginBottom: SPACING.sm },
  rowHint: { fontSize: 11, color: COLORS.text.secondary, marginTop: 4 },
  coletaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  coletaDate: { width: 44, fontSize: 12, fontWeight: '700', color: COLORS.text.secondary },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  primaryBtnText: { color: COLORS.text.white, fontWeight: '700', fontSize: 14 },
  secondaryBtn: { alignSelf: 'center', paddingVertical: SPACING.xs, paddingHorizontal: SPACING.sm },
  secondaryBtnText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
    gap: SPACING.sm,
    elevation: 1,
  },
  alertDot: { width: 12, height: 12, borderRadius: 6 },
  alertInfo: { flex: 1 },
  alertName: { fontSize: 14, fontWeight: '600', color: COLORS.text.primary },
  alertSub: { fontSize: 12, color: COLORS.text.secondary },
  alertLevel: { fontSize: 14, fontWeight: '700', color: COLORS.text.primary },
  bottomSpacer: { height: SPACING.xl },
  emptyText: {
    marginTop: SPACING.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    fontSize: 14,
  },
  dateFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dateBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateBtnText: { fontSize: 12, color: COLORS.text.primary, fontWeight: '600' },
  dateSep: { fontSize: 13, color: COLORS.text.secondary },
  condoFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  condoFilterText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '70%',
    padding: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text.primary,
  },
  searchInput: {
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
  condoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  condoItemSelected: {
    backgroundColor: `${COLORS.primary}14`,
  },
  condoItemText: {
    fontSize: 14,
    color: COLORS.text.primary,
  },
  condoItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
