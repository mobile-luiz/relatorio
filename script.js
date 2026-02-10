/**
 * ALL MOTORS - Dashboard de Checklists
 * Versão: 8.0.0 (Com filtros de data)
 */

class Dashboard {
    constructor() {
        // Configurações modernizadas
        this.config = {
            API_URL: 'https://script.google.com/macros/s/AKfycbw7WijWu0BtEKklj2H9MiznO5CpWgf9B2B3E-T68OozQXx9w8E0SkSr7ubETheQPKJG/exec',
            TIMEOUT: 20000,
            CACHE_TTL: 5 * 60 * 1000, // 5 minutos
            MAX_CHART_ITEMS: 8,
            
            THEME: {
                colors: {
                    primary: '#0066cc',
                    secondary: '#00b894',
                    accent: '#6c5ce7',
                    warning: '#fdcb6e',
                    danger: '#e17055',
                    info: '#0984e3',
                    dark: '#1a1a1a',
                    light: '#f9f9f9'
                },
                gradients: {
                    primary: ['#0066cc', '#6c5ce7'],
                    success: ['#00b894', '#00cec9'],
                    warning: ['#fdcb6e', '#e17055'],
                    info: ['#0984e3', '#74b9ff']
                }
            }
        };

        // Estado da aplicação
        this.state = {
            data: [],
            filteredData: [],
            currentPage: 1,
            itemsPerPage: 25,
            sortConfig: { field: 'date', direction: 'desc' },
            filters: {
                search: '',
                status: '',
                fabricante: '',
                dateStart: null,
                dateEnd: null,
                quickFilter: '1' // Hoje por padrão
            },
            statuses: new Set(),
            fabricantes: new Set(),
            tecnicos: new Set(),
            modelos: new Map(),
            charts: {
                modelos: null,
                timeline: null
            },
            isLoading: false,
            lastUpdate: null,
            totalChecklistsAllTime: 0
        };

        // Inicialização
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Inicializando Dashboard All Motors...');
            this.initElements();
            this.initEventListeners();
            this.initDateFilters();
            this.showLoading();
            
            // Carregar dados da API
            await this.loadData();
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            this.handleError(error);
        }
    }

    initElements() {
        // Estatísticas
        this.elements = {
            // Stats
            totalChecklists: document.getElementById('total-checklists'),
            totalFabricantes: document.getElementById('total-fabricantes'),
            totalTecnicos: document.getElementById('total-tecnicos'),
            totalVeiculos: document.getElementById('total-veiculos'),
            checklistTrend: document.getElementById('checklist-trend'),
            checklistPeriod: document.getElementById('checklist-period'),
            
            // Gráficos
            modelosChart: document.getElementById('modelosChart'),
            timelineChart: document.getElementById('timelineChart'),
            chartType: document.getElementById('chart-type'),
            chartAggregation: document.getElementById('chart-aggregation'),
            todayCount: document.getElementById('today-count'),
            todayCountValue: document.getElementById('today-count-value'),
            
            // Filtros de Data
            startDate: document.getElementById('start-date'),
            endDate: document.getElementById('end-date'),
            applyDateFilter: document.getElementById('apply-date-filter'),
            dateQuickFilters: document.querySelectorAll('.date-quick-btn'),
            dateRange: document.getElementById('date-range'),
            filterInfo: document.getElementById('filter-info'),
            
            // Tabela
            tableBody: document.getElementById('table-body'),
            searchInput: document.getElementById('search-input'),
            filterStatus: document.getElementById('filter-status'),
            filterFabricante: document.getElementById('filter-fabricante'),
            itemsPerPage: document.getElementById('items-per-page'),
            
            // Paginação
            startItem: document.getElementById('start-item'),
            endItem: document.getElementById('end-item'),
            totalItems: document.getElementById('total-items'),
            currentPage: document.getElementById('current-page'),
            totalPages: document.getElementById('total-pages'),
            firstPage: document.getElementById('first-page'),
            prevPage: document.getElementById('prev-page'),
            nextPage: document.getElementById('next-page'),
            lastPage: document.getElementById('last-page'),
            
            // Botões
            exportBtn: document.getElementById('export-btn'),
            refreshBtn: document.getElementById('refresh-btn'),
            retryBtn: document.getElementById('retry-btn'),
            
            // Estados
            loadingOverlay: document.getElementById('loading-overlay'),
            emptyState: document.getElementById('empty-state'),
            emptyStateMessage: document.getElementById('empty-state-message')
        };
        
        // Verificar quais elementos não foram encontrados
        Object.keys(this.elements).forEach(key => {
            if (!this.elements[key]) {
                console.warn(`⚠️ Elemento não encontrado: ${key}`);
            }
        });
    }

    initDateFilters() {
        // Definir datas padrão (hoje)
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        // Formatos YYYY-MM-DD para inputs date
        const formatDateForInput = (date) => {
            return date.toISOString().split('T')[0];
        };
        
        // Definir data inicial como 7 dias atrás
        if (this.elements.startDate) {
            this.elements.startDate.value = formatDateForInput(sevenDaysAgo);
            this.state.filters.dateStart = sevenDaysAgo;
        }
        
        // Definir data final como hoje
        if (this.elements.endDate) {
            this.elements.endDate.value = formatDateForInput(today);
            this.elements.endDate.max = formatDateForInput(today); // Não permitir datas futuras
            this.state.filters.dateEnd = today;
        }
        
        // Atualizar label de filtro
        this.updateFilterInfo();
    }

    initEventListeners() {
        // Busca
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', 
                this.debounce(this.handleSearch.bind(this), 300)
            );
        }
        
        // Filtros
        if (this.elements.filterStatus) {
            this.elements.filterStatus.addEventListener('change', 
                this.handleFilterChange.bind(this)
            );
        }
        
        if (this.elements.filterFabricante) {
            this.elements.filterFabricante.addEventListener('change', 
                this.handleFilterChange.bind(this)
            );
        }
        
        if (this.elements.itemsPerPage) {
            this.elements.itemsPerPage.addEventListener('change', 
                this.handleItemsPerPageChange.bind(this)
            );
        }
        
        // Filtros de Data
        if (this.elements.startDate) {
            this.elements.startDate.addEventListener('change', 
                this.handleDateChange.bind(this)
            );
        }
        
        if (this.elements.endDate) {
            this.elements.endDate.addEventListener('change', 
                this.handleDateChange.bind(this)
            );
        }
        
        if (this.elements.applyDateFilter) {
            this.elements.applyDateFilter.addEventListener('click', 
                this.applyDateFilter.bind(this)
            );
        }
        
        // Filtros rápidos
        if (this.elements.dateQuickFilters) {
            this.elements.dateQuickFilters.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.handleQuickFilter(e.target);
                });
            });
        }
        
        // Paginação
        if (this.elements.firstPage) {
            this.elements.firstPage.addEventListener('click', 
                () => this.goToPage(1)
            );
        }
        if (this.elements.prevPage) {
            this.elements.prevPage.addEventListener('click', 
                () => this.goToPage(this.state.currentPage - 1)
            );
        }
        if (this.elements.nextPage) {
            this.elements.nextPage.addEventListener('click', 
                () => this.goToPage(this.state.currentPage + 1)
            );
        }
        if (this.elements.lastPage) {
            this.elements.lastPage.addEventListener('click', 
                () => this.goToPage(Math.ceil(this.state.filteredData.length / this.state.itemsPerPage))
            );
        }
        
        // Ordenação
        setTimeout(() => {
            document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
                th.addEventListener('click', () => {
                    const field = th.dataset.sort;
                    this.handleSort(field);
                });
            });
        }, 100);
        
        // Gráficos
        if (this.elements.chartType) {
            this.elements.chartType.addEventListener('change', 
                this.updateChartType.bind(this)
            );
        }
        if (this.elements.chartAggregation) {
            this.elements.chartAggregation.addEventListener('change', 
                this.updateChartAggregation.bind(this)
            );
        }
        
        // Botões de ação
        if (this.elements.exportBtn) {
            this.elements.exportBtn.addEventListener('click', 
                this.exportData.bind(this)
            );
        }
        if (this.elements.refreshBtn) {
            this.elements.refreshBtn.addEventListener('click', 
                this.refreshData.bind(this)
            );
        }
        if (this.elements.retryBtn) {
            this.elements.retryBtn.addEventListener('click', 
                this.retryLoad.bind(this)
            );
        }
    }

    async loadData() {
        try {
            console.log('📡 Buscando dados da API...');
            
            // Usar AbortController para timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.TIMEOUT);
            
            const response = await fetch(this.config.API_URL, {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!Array.isArray(data) || data.length === 0) {
                this.showEmptyState('Nenhum dado encontrado na planilha.');
                this.hideLoading();
                return;
            }
            
            console.log(`✅ ${data.length} registros carregados`);
            
            // Processar e armazenar dados
            this.processData(data);
            this.applyDateFilter(); // Aplicar filtro de data padrão
            this.updateDashboard();
            this.hideLoading();
            
        } catch (error) {
            this.hideLoading();
            throw error;
        }
    }

    processData(rawData) {
        console.log('🔄 Processando dados...');
        
        // Resetar coleções
        this.state.fabricantes.clear();
        this.state.tecnicos.clear();
        this.state.statuses.clear();
        this.state.modelos.clear();
        
        const processedData = rawData.map((item, index) => {
            // Normalizar dados
            const normalized = {
                id: index + 1,
                date: this.normalizeDate(item.DATA || item.data || item.DATAENTRADA),
                placa: (item.PLACA || item.placa || '').toUpperCase().trim(),
                modelo: (item.MODELO || item.modelo || 'Desconhecido').trim(),
                fabricante: (item.FABRICANTE || item.fabricante || 'Desconhecido').trim(),
                tecnico: this.normalizeTecnico(item),
                status: this.normalizeStatus(item.STATUS || item.status),
                rawData: item
            };
            
            // Coletar dados para filtros
            this.state.fabricantes.add(normalized.fabricante);
            this.state.tecnicos.add(normalized.tecnico);
            this.state.statuses.add(normalized.status.type);
            
            // Contar modelos
            this.state.modelos.set(
                normalized.modelo,
                (this.state.modelos.get(normalized.modelo) || 0) + 1
            );
            
            return normalized;
        });
        
        this.state.data = processedData.sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        this.state.totalChecklistsAllTime = this.state.data.length;
        this.state.lastUpdate = new Date();
        console.log('✅ Dados processados:', this.state.data.length, 'registros');
        
        // Atualizar dropdown de fabricantes
        this.updateFabricantesDropdown();
    }

    normalizeDate(dateString) {
        try {
            if (!dateString) return new Date().toISOString();
            
            // Tentar diferentes formatos de data
            let date = new Date(dateString);
            
            // Se for string no formato brasileiro DD/MM/YYYY
            if (isNaN(date.getTime()) && dateString.includes('/')) {
                const parts = dateString.split('/');
                if (parts.length === 3) {
                    // DD/MM/YYYY ou DD/MM/YYYY HH:mm
                    const datePart = parts[2].split(' ')[0];
                    date = new Date(datePart, parts[1] - 1, parts[0]);
                }
            }
            
            if (!isNaN(date.getTime())) return date.toISOString();
            
            // Se a data for inválida, usar data atual
            console.warn(`Data inválida: ${dateString}`);
            return new Date().toISOString();
        } catch {
            return new Date().toISOString();
        }
    }

    normalizeTecnico(item) {
        const sources = [
            item.TECNICO_LOGADO,
            item.TECNICO,
            item.tecnico,
            item.RESPONSAVEL
        ];
        
        for (const source of sources) {
            if (source && source.trim()) {
                return source.trim();
            }
        }
        
        return 'Técnico não informado';
    }

    normalizeStatus(status) {
        if (!status) {
            return { type: 'unknown', label: 'Não informado', icon: 'question-circle' };
        }
        
        const statusLower = String(status).toLowerCase().trim();
        
        const statusMap = {
            completed: ['concluído', 'finalizado', 'completado', 'done', 'complete'],
            pending: ['pendente', 'aguardando', 'esperando', 'pending'],
            progress: ['andamento', 'progresso', 'processando', 'in progress', 'em andamento'],
            cancelled: ['cancelado', 'cancelada', 'cancelled']
        };
        
        for (const [type, keywords] of Object.entries(statusMap)) {
            if (keywords.some(keyword => statusLower.includes(keyword))) {
                const labels = {
                    completed: { label: 'Concluído', icon: 'check-circle' },
                    pending: { label: 'Pendente', icon: 'clock' },
                    progress: { label: 'Em andamento', icon: 'sync-alt' },
                    cancelled: { label: 'Cancelado', icon: 'times-circle' }
                };
                return { type, ...labels[type] };
            }
        }
        
        return { 
            type: 'unknown', 
            label: status.charAt(0).toUpperCase() + status.slice(1), 
            icon: 'question-circle' 
        };
    }

    applyDateFilter() {
        console.log('📅 Aplicando filtro de data...');
        
        // Obter datas dos inputs
        const startDate = this.elements.startDate?.value;
        const endDate = this.elements.endDate?.endDate;
        
        if (startDate) {
            this.state.filters.dateStart = new Date(startDate);
            // Resetar para início do dia
            this.state.filters.dateStart.setHours(0, 0, 0, 0);
        }
        
        if (endDate) {
            this.state.filters.dateEnd = new Date(endDate);
            // Definir para fim do dia
            this.state.filters.dateEnd.setHours(23, 59, 59, 999);
        }
        
        // Aplicar filtro rápido se selecionado
        this.applyQuickFilter();
        
        // Atualizar dashboard
        this.updateDashboard();
        
        // Atualizar informação do filtro
        this.updateFilterInfo();
        
        this.showNotification('Filtro de data aplicado', 'success');
    }

    applyQuickFilter() {
        const days = parseInt(this.state.filters.quickFilter);
        
        if (days === 0) {
            // Todo período
            this.state.filters.dateStart = null;
            this.state.filters.dateEnd = null;
        } else {
            const today = new Date();
            const startDate = new Date();
            startDate.setDate(today.getDate() - days + 1); // +1 para incluir hoje
            
            // Definir para início do dia
            startDate.setHours(0, 0, 0, 0);
            
            // Definir para fim do dia
            today.setHours(23, 59, 59, 999);
            
            this.state.filters.dateStart = startDate;
            this.state.filters.dateEnd = today;
            
            // Atualizar inputs de data
            if (this.elements.startDate && this.elements.endDate) {
                this.elements.startDate.value = this.formatDateForInput(startDate);
                this.elements.endDate.value = this.formatDateForInput(today);
            }
        }
    }

    handleQuickFilter(button) {
        // Remover classe active de todos os botões
        this.elements.dateQuickFilters.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Adicionar classe active ao botão clicado
        button.classList.add('active');
        
        // Atualizar filtro rápido
        const days = button.dataset.days;
        this.state.filters.quickFilter = days;
        
        // Aplicar filtro
        this.applyDateFilter();
    }

    handleDateChange() {
        // Quando o usuário altera manualmente as datas, desativa o filtro rápido
        this.elements.dateQuickFilters.forEach(btn => {
            btn.classList.remove('active');
        });
        this.state.filters.quickFilter = null;
    }

    updateDashboard() {
        console.log('🎨 Atualizando dashboard...');
        
        // Aplicar filtros atuais
        this.applyFilters();
        
        // Atualizar estatísticas
        this.updateStats();
        
        // Atualizar tabela
        this.updateTable();
        
        // Atualizar gráficos
        this.updateCharts();
        
        // Atualizar paginação
        this.updatePagination();
        
        // Atualizar interface
        this.updateUIState();
        
        console.log('✅ Dashboard atualizado');
    }

    applyFilters() {
        let filtered = [...this.state.data];
        
        // Filtro de busca
        if (this.state.filters.search) {
            const searchTerm = this.state.filters.search.toLowerCase();
            filtered = filtered.filter(item =>
                item.placa.toLowerCase().includes(searchTerm) ||
                item.modelo.toLowerCase().includes(searchTerm) ||
                item.fabricante.toLowerCase().includes(searchTerm) ||
                item.tecnico.toLowerCase().includes(searchTerm)
            );
        }
        
        // Filtro de status
        if (this.state.filters.status) {
            filtered = filtered.filter(item => 
                item.status.type === this.state.filters.status
            );
        }
        
        // Filtro de fabricante
        if (this.state.filters.fabricante) {
            filtered = filtered.filter(item => 
                item.fabricante === this.state.filters.fabricante
            );
        }
        
        // Filtro por data
        if (this.state.filters.dateStart) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= this.state.filters.dateStart;
            });
        }
        
        if (this.state.filters.dateEnd) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate <= this.state.filters.dateEnd;
            });
        }
        
        // Aplicar ordenação
        this.sortData(filtered);
        
        this.state.filteredData = filtered;
        this.state.currentPage = 1; // Resetar para primeira página
        
        console.log('🔍 Filtros aplicados:', this.state.filteredData.length, 'registros');
    }

    sortData(data) {
        const { field, direction } = this.state.sortConfig;
        
        data.sort((a, b) => {
            let aValue = a[field];
            let bValue = b[field];
            
            if (field === 'date') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else {
                aValue = String(aValue || '').toLowerCase();
                bValue = String(bValue || '').toLowerCase();
            }
            
            if (direction === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }

    updateStats() {
        const filteredChecklists = this.state.filteredData.length;
        const totalFabricantes = new Set(this.state.filteredData.map(d => d.fabricante)).size;
        const totalTecnicos = new Set(this.state.filteredData.map(d => d.tecnico)).size;
        const totalVeiculos = new Set(this.state.filteredData.map(d => d.placa)).size;
        
        // Calcular tendência (comparar com período anterior similar)
        const trend = this.calculateTrend();
        
        // Atualizar elementos
        this.updateElement(this.elements.totalChecklists, filteredChecklists.toLocaleString());
        this.updateElement(this.elements.totalFabricantes, totalFabricantes.toLocaleString());
        this.updateElement(this.elements.totalTecnicos, totalTecnicos.toLocaleString());
        this.updateElement(this.elements.totalVeiculos, totalVeiculos.toLocaleString());
        
        // Atualizar tendência
        if (this.elements.checklistTrend) {
            this.elements.checklistTrend.textContent = `${trend}%`;
            this.elements.checklistTrend.className = `stat-trend trend-${trend >= 0 ? 'up' : 'down'}`;
        }
        
        // Atualizar período
        if (this.elements.checklistPeriod) {
            this.elements.checklistPeriod.textContent = this.getPeriodDescription();
        }
        
        // Contar checklists de hoje
        this.updateTodayCount();
    }

    calculateTrend() {
        // Simples cálculo de tendência (pode ser aprimorado)
        if (this.state.totalChecklistsAllTime === 0) return 0;
        
        const currentCount = this.state.filteredData.length;
        const previousCount = this.state.totalChecklistsAllTime - currentCount;
        
        if (previousCount === 0) return 100;
        
        const trend = ((currentCount - previousCount) / previousCount) * 100;
        return Math.round(trend);
    }

    getPeriodDescription() {
        if (!this.state.filters.dateStart || !this.state.filters.dateEnd) {
            return 'Todo o período';
        }
        
        const start = this.formatDateShort(this.state.filters.dateStart);
        const end = this.formatDateShort(this.state.filters.dateEnd);
        
        return `De ${start} até ${end}`;
    }

    updateTodayCount() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayChecklists = this.state.filteredData.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= today && itemDate < tomorrow;
        }).length;
        
        if (this.elements.todayCount && this.elements.todayCountValue) {
            if (todayChecklists > 0) {
                this.elements.todayCount.style.display = 'inline-flex';
                this.elements.todayCountValue.textContent = todayChecklists;
            } else {
                this.elements.todayCount.style.display = 'none';
            }
        }
    }

    updateFabricantesDropdown() {
        if (!this.elements.filterFabricante) return;
        
        const fabricantes = Array.from(this.state.fabricantes)
            .filter(f => f && f !== 'Desconhecido')
            .sort();
        
        let options = '<option value="">Todos fabricantes</option>';
        fabricantes.forEach(fabricante => {
            const selected = fabricante === this.state.filters.fabricante ? 'selected' : '';
            options += `<option value="${fabricante}" ${selected}>${fabricante}</option>`;
        });
        
        this.elements.filterFabricante.innerHTML = options;
    }

    updateFilterInfo() {
        if (!this.elements.filterInfo) return;
        
        let info = 'Filtrado por: ';
        
        if (!this.state.filters.dateStart || !this.state.filters.dateEnd) {
            info += 'Todo período';
        } else {
            const start = this.formatDateShort(this.state.filters.dateStart);
            const end = this.formatDateShort(this.state.filters.dateEnd);
            
            if (start === end) {
                info += start;
            } else {
                info += `${start} - ${end}`;
            }
        }
        
        // Adicionar contagem
        info += ` (${this.state.filteredData.length} registros)`;
        
        this.elements.filterInfo.textContent = info;
    }

    updateTable() {
        const { currentPage, itemsPerPage, filteredData } = this.state;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        if (!this.elements.tableBody) return;
        
        if (pageData.length === 0) {
            this.showEmptyTable();
            return;
        }
        
        const tableHTML = pageData.map(item => this.createTableRow(item)).join('');
        this.elements.tableBody.innerHTML = tableHTML;
    }

    createTableRow(item) {
        const date = new Date(item.date);
        const isToday = this.isToday(date);
        
        const statusColors = {
            'completed': { bg: 'rgba(0, 184, 148, 0.1)', text: '#00b894', border: 'rgba(0, 184, 148, 0.2)' },
            'pending': { bg: 'rgba(253, 203, 110, 0.1)', text: '#d63031', border: 'rgba(253, 203, 110, 0.2)' },
            'progress': { bg: 'rgba(9, 132, 227, 0.1)', text: '#0984e3', border: 'rgba(9, 132, 227, 0.2)' },
            'cancelled': { bg: 'rgba(225, 112, 85, 0.1)', text: '#e17055', border: 'rgba(225, 112, 85, 0.2)' },
            'unknown': { bg: 'rgba(99, 110, 114, 0.1)', text: '#636e72', border: 'rgba(99, 110, 114, 0.2)' }
        };
        
        const colors = statusColors[item.status.type] || statusColors.unknown;
        
        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="far fa-calendar" style="color: ${isToday ? '#e17055' : '#0066cc'}"></i>
                        <span>${this.formatDate(item.date)}</span>
                        ${isToday ? '<span style="background: #e17055; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: bold;">HOJE</span>' : ''}
                    </div>
                </td>
                <td>
                    <span style="display: inline-block; background: #f8f9fa; padding: 4px 12px; border-radius: 20px; font-family: monospace; font-weight: bold; border: 1px solid #dee2e6; font-size: 13px;">
                        ${item.placa || 'N/A'}
                    </span>
                </td>
                <td>
                    <strong style="display: block; color: #1a1a1a;">${item.modelo}</strong>
                    <small style="color: #636e72; font-size: 12px;">${item.fabricante}</small>
                </td>
                <td style="color: #415a77; font-weight: 500;">${item.fabricante}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #0066cc, #6c5ce7); color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">
                            ${item.tecnico.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <strong style="color: #1a1a1a;">${item.tecnico}</strong>
                            <br>
                            <small style="color: #636e72; font-size: 12px;">Técnico</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span style="padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; background: ${colors.bg}; color: ${colors.text}; border: 1px solid ${colors.border};">
                        <i class="fas fa-${item.status.icon}"></i>
                        ${item.status.label}
                    </span>
                </td>
                <td>
                    <button onclick="dashboard.viewDetails(${item.id})" style="padding: 6px 12px; background: #0066cc; color: white; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; transition: all 0.2s;" 
                            onmouseover="this.style.background='#0052a3'" 
                            onmouseout="this.style.background='#0066cc'">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `;
    }

    updateCharts() {
        // Destruir gráficos existentes
        if (this.state.charts.modelos) {
            this.state.charts.modelos.destroy();
        }
        if (this.state.charts.timeline) {
            this.state.charts.timeline.destroy();
        }
        
        // Criar novos gráficos se houver dados
        if (this.state.filteredData.length > 0) {
            this.createModelosChart();
            this.createTimelineChart();
        }
    }

    createModelosChart() {
        if (!this.elements.modelosChart) {
            console.warn('Canvas modelosChart não encontrado');
            return;
        }
        
        const ctx = this.elements.modelosChart.getContext('2d');
        const chartType = this.elements.chartType?.value || 'bar';
        
        // Preparar dados dos modelos mais frequentes
        const sortedModelos = Array.from(this.state.modelos.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.config.MAX_CHART_ITEMS);
        
        if (sortedModelos.length === 0) return;
        
        const labels = sortedModelos.map(([modelo]) => 
            modelo.length > 15 ? modelo.substring(0, 12) + '...' : modelo
        );
        const data = sortedModelos.map(([, count]) => count);
        
        try {
            this.state.charts.modelos = new Chart(ctx, {
                type: chartType,
                data: {
                    labels,
                    datasets: [{
                        label: 'Checklists',
                        data,
                        backgroundColor: chartType === 'bar' 
                            ? this.config.THEME.colors.primary
                            : this.generateColors(sortedModelos.length),
                        borderColor: '#ffffff',
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: chartType === 'pie' || chartType === 'doughnut',
                            position: 'right'
                        }
                    },
                    scales: chartType === 'bar' ? {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                        }
                    } : {}
                }
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de modelos:', error);
        }
    }

    createTimelineChart() {
        if (!this.elements.timelineChart) {
            console.warn('Canvas timelineChart não encontrado');
            return;
        }
        
        const ctx = this.elements.timelineChart.getContext('2d');
        const aggregation = this.elements.chartAggregation?.value || 'daily';
        
        // Agrupar dados conforme a agregação selecionada
        let groupedData = {};
        
        if (aggregation === 'daily') {
            groupedData = this.groupByDay();
        } else if (aggregation === 'weekly') {
            groupedData = this.groupByWeek();
        } else if (aggregation === 'monthly') {
            groupedData = this.groupByMonth();
        }
        
        const entries = Object.entries(groupedData).sort((a, b) => {
            return new Date(a[0]) - new Date(b[0]);
        });
        
        if (entries.length === 0) return;
        
        const labels = entries.map(([date]) => {
            const d = new Date(date);
            if (aggregation === 'daily') {
                return d.getDate() === new Date().getDate() ? 'Hoje' : 
                       `${d.getDate()}/${d.getMonth() + 1}`;
            } else if (aggregation === 'weekly') {
                return `Sem ${this.getWeekNumber(d)}`;
            } else {
                return d.toLocaleDateString('pt-BR', { month: 'short' });
            }
        });
        
        const data = entries.map(([, count]) => count);
        
        try {
            this.state.charts.timeline = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Checklists',
                        data,
                        backgroundColor: 'rgba(0, 102, 204, 0.1)',
                        borderColor: this.config.THEME.colors.primary,
                        borderWidth: 3,
                        tension: 0.3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { stepSize: 1 }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Erro ao criar gráfico de timeline:', error);
        }
    }

    groupByDay() {
        const dataByDate = {};
        
        this.state.filteredData.forEach(item => {
            try {
                const itemDate = new Date(item.date);
                const dateKey = itemDate.toISOString().split('T')[0]; // YYYY-MM-DD
                
                dataByDate[dateKey] = (dataByDate[dateKey] || 0) + 1;
            } catch (error) {
                console.warn('Erro ao processar data do item:', item);
            }
        });
        
        return dataByDate;
    }

    groupByWeek() {
        const dataByWeek = {};
        
        this.state.filteredData.forEach(item => {
            try {
                const itemDate = new Date(item.date);
                const year = itemDate.getFullYear();
                const weekNumber = this.getWeekNumber(itemDate);
                const weekKey = `${year}-W${weekNumber}`;
                
                dataByWeek[weekKey] = (dataByWeek[weekKey] || 0) + 1;
            } catch (error) {
                console.warn('Erro ao processar data do item:', item);
            }
        });
        
        return dataByWeek;
    }

    groupByMonth() {
        const dataByMonth = {};
        
        this.state.filteredData.forEach(item => {
            try {
                const itemDate = new Date(item.date);
                const year = itemDate.getFullYear();
                const month = itemDate.getMonth() + 1;
                const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
                
                dataByMonth[monthKey] = (dataByMonth[monthKey] || 0) + 1;
            } catch (error) {
                console.warn('Erro ao processar data do item:', item);
            }
        });
        
        return dataByMonth;
    }

    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    }

    updatePagination() {
        const { currentPage, itemsPerPage, filteredData } = this.state;
        const totalItems = filteredData.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
        
        const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(currentPage * itemsPerPage, totalItems);
        
        // Atualizar elementos com verificação de null
        this.updateElement(this.elements.startItem, startItem.toLocaleString());
        this.updateElement(this.elements.endItem, endItem.toLocaleString());
        this.updateElement(this.elements.totalItems, totalItems.toLocaleString());
        this.updateElement(this.elements.currentPage, currentPage);
        this.updateElement(this.elements.totalPages, totalPages);
        
        // Atualizar estado dos botões
        this.setButtonDisabled(this.elements.firstPage, currentPage <= 1);
        this.setButtonDisabled(this.elements.prevPage, currentPage <= 1);
        this.setButtonDisabled(this.elements.nextPage, currentPage >= totalPages);
        this.setButtonDisabled(this.elements.lastPage, currentPage >= totalPages);
    }

    updateUIState() {
        const hasData = this.state.filteredData.length > 0;
        
        // Mostrar/ocultar estado vazio
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = hasData ? 'none' : 'block';
            if (this.elements.emptyStateMessage && !hasData) {
                this.elements.emptyStateMessage.textContent = 
                    'Nenhum checklist encontrado para os filtros aplicados.';
            }
        }
        
        // Habilitar/desabilitar controles
        this.enableControls(hasData);
        
        // Atualizar indicadores de ordenação
        this.updateSortIndicators();
    }

    // Handlers de Eventos
    handleSearch(event) {
        this.state.filters.search = event.target.value.trim();
        this.updateDashboard();
    }

    handleFilterChange(event) {
        const element = event.target;
        const value = element.value;
        
        if (element.id === 'filter-status') {
            this.state.filters.status = value;
        } else if (element.id === 'filter-fabricante') {
            this.state.filters.fabricante = value;
        }
        
        this.updateDashboard();
    }

    handleItemsPerPageChange(event) {
        this.state.itemsPerPage = parseInt(event.target.value);
        this.updateDashboard();
    }

    handleSort(field) {
        const direction = this.state.sortConfig.field === field && 
                         this.state.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        
        this.state.sortConfig = { field, direction };
        this.updateDashboard();
    }

    updateChartType() {
        if (this.state.charts.modelos) {
            this.state.charts.modelos.destroy();
            this.createModelosChart();
        }
    }

    updateChartAggregation() {
        if (this.state.charts.timeline) {
            this.state.charts.timeline.destroy();
            this.createTimelineChart();
        }
    }

    // Métodos auxiliares
    goToPage(page) {
        const totalPages = Math.ceil(this.state.filteredData.length / this.state.itemsPerPage);
        
        if (page >= 1 && page <= totalPages) {
            this.state.currentPage = page;
            this.updateTable();
            this.updatePagination();
            
            // Scroll suave para o topo da tabela
            const tableSection = document.querySelector('.table-section');
            if (tableSection) {
                tableSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }

    async refreshData() {
        this.showLoading();
        this.showNotification('Atualizando dados...', 'info');
        
        try {
            // Recarregar dados
            await this.loadData();
            
            this.showNotification('Dados atualizados com sucesso!', 'success');
        } catch (error) {
            this.handleError(error);
        }
    }

    async retryLoad() {
        this.showLoading();
        this.hideEmptyState();
        
        try {
            await this.loadData();
        } catch (error) {
            this.handleError(error);
        }
    }

    exportData() {
        if (this.state.filteredData.length === 0) {
            this.showNotification('Não há dados para exportar', 'warning');
            return;
        }
        
        // Criar CSV
        const headers = ['Data', 'Placa', 'Modelo', 'Fabricante', 'Técnico', 'Status'];
        const csvRows = [
            headers.join(','),
            ...this.state.filteredData.map(item => [
                this.formatDateForExport(item.date),
                `"${item.placa}"`,
                `"${item.modelo}"`,
                `"${item.fabricante}"`,
                `"${item.tecnico}"`,
                `"${item.status.label}"`
            ].join(','))
        ];
        
        const csv = csvRows.join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        // Criar link para download
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().slice(0, 10);
        const startDate = this.state.filters.dateStart ? 
            this.formatDateShort(this.state.filters.dateStart).replace('/', '-') : 'all';
        const endDate = this.state.filters.dateEnd ? 
            this.formatDateShort(this.state.filters.dateEnd).replace('/', '-') : 'all';
        a.download = `checklists_${startDate}_to_${endDate}_${this.state.filteredData.length}_registros.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        
        this.showNotification(
            `${this.state.filteredData.length} registros exportados`,
            'success'
        );
    }

    viewDetails(id) {
        const item = this.state.data.find(d => d.id === id);
        if (!item) return;
        
        // Criar modal de detalhes (implementação similar à anterior)
        // ... (mantenha a implementação anterior do modal)
    }

    // Utilitários de Data
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Data inválida';
            
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Data inválida';
        }
    }

    formatDateShort(date) {
        if (!date) return '';
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    formatDateForExport(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch {
            return dateString;
        }
    }

    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    }

    generateColors(count) {
        const colors = [
            '#0066cc', '#00b894', '#6c5ce7', '#fdcb6e',
            '#e17055', '#0984e3', '#00cec9', '#a29bfe'
        ];
        
        return colors.slice(0, count);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Métodos de UI
    showLoading() {
        this.state.isLoading = true;
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'flex';
        }
    }

    hideLoading() {
        this.state.isLoading = false;
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = 'none';
        }
    }

    showEmptyState(message = '') {
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'block';
            if (message && this.elements.emptyStateMessage) {
                this.elements.emptyStateMessage.textContent = message;
            }
        }
    }

    hideEmptyState() {
        if (this.elements.emptyState) {
            this.elements.emptyState.style.display = 'none';
        }
    }

    showEmptyTable() {
        if (!this.elements.tableBody) return;
        
        this.elements.tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 60px 20px; color: #636e72;">
                    <i class="fas fa-search" style="font-size: 48px; margin-bottom: 20px; opacity: 0.5;"></i>
                    <h4 style="margin-bottom: 10px; color: #2d3436;">Nenhum resultado encontrado</h4>
                    <p style="margin-bottom: 20px;">Nenhum checklist corresponde aos filtros aplicados.</p>
                    <button onclick="dashboard.resetFilters()" style="padding: 10px 20px; border: 2px solid #0066cc; border-radius: 6px; background: white; color: #0066cc; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-redo"></i> Limpar Filtros
                    </button>
                </td>
            </tr>
        `;
    }

    showNotification(message, type = 'info', duration = 5000) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        
        const icon = type === 'success' ? 'check-circle' :
                     type === 'error' ? 'exclamation-circle' :
                     type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        const bgColor = type === 'success' ? '#00b894' :
                       type === 'error' ? '#e17055' :
                       type === 'warning' ? '#fdcb6e' : '#0066cc';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}" style="color: white; font-size: 18px;"></i>
            <span style="color: white; font-weight: 500;">${message}</span>
            <button id="notification-close" style="margin-left: auto; background: none; border: none; color: white; cursor: pointer; padding: 4px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            background: ${bgColor};
            padding: 16px 20px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            min-width: 300px;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
        
        // Botão fechar
        notification.querySelector('#notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    updateSortIndicators() {
        document.querySelectorAll('.data-table th i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        
        const currentTh = document.querySelector(
            `.data-table th[data-sort="${this.state.sortConfig.field}"]`
        );
        
        if (currentTh) {
            const icon = currentTh.querySelector('i');
            if (icon) {
                icon.className = this.state.sortConfig.direction === 'asc' 
                    ? 'fas fa-sort-up' 
                    : 'fas fa-sort-down';
            }
        }
    }

    enableControls(enabled) {
        const controls = [
            this.elements.exportBtn,
            this.elements.searchInput,
            this.elements.filterStatus,
            this.elements.filterFabricante,
            this.elements.itemsPerPage,
            this.elements.chartType,
            this.elements.chartAggregation,
            this.elements.startDate,
            this.elements.endDate,
            this.elements.applyDateFilter
        ];
        
        controls.forEach(control => {
            if (control) {
                control.disabled = !enabled;
            }
        });
    }

    resetFilters() {
        this.state.filters = {
            search: '',
            status: '',
            fabricante: '',
            dateStart: null,
            dateEnd: null,
            quickFilter: '1'
        };
        
        // Resetar inputs
        if (this.elements.searchInput) {
            this.elements.searchInput.value = '';
        }
        
        if (this.elements.filterStatus) {
            this.elements.filterStatus.value = '';
        }
        
        if (this.elements.filterFabricante) {
            this.elements.filterFabricante.value = '';
        }
        
        // Resetar datas para padrão (últimos 7 dias)
        this.initDateFilters();
        
        // Ativar botão "Hoje"
        this.elements.dateQuickFilters.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.days === '1') {
                btn.classList.add('active');
            }
        });
        
        this.updateDashboard();
        this.showNotification('Filtros resetados', 'success');
    }

    handleError(error) {
        console.error('❌ Erro:', error);
        
        let message = 'Erro ao carregar dados';
        
        if (error.name === 'AbortError') {
            message = 'Tempo limite excedido. Verifique sua conexão.';
        } else if (error.message.includes('Failed to fetch')) {
            message = 'Não foi possível conectar ao servidor.';
        } else if (error.message.includes('HTTP')) {
            message = `Erro ${error.message}`;
        }
        
        this.showNotification(message, 'error', 10000);
        this.showEmptyState(message);
        this.hideLoading();
    }

    // Métodos auxiliares de UI
    updateElement(element, value) {
        if (element) {
            element.textContent = value;
        }
    }

    setButtonDisabled(button, disabled) {
        if (button) {
            button.disabled = disabled;
        }
    }
}

// Inicializar aplicação
let dashboard;

document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    window.dashboard = dashboard;
});