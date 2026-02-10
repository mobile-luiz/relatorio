/**
 * DASHBOARD ALL MOTORS - Sistema de Gestão Veicular
 * Versão: 3.1.1
 * Estilo: Bancário Premium
 * Alteração: Menu lateral removido, header top adicionado
 */

class Dashboard {
    constructor() {
        // Configurações
        this.config = {
            API_URL: 'https://script.google.com/macros/s/AKfycbyEyVCNM_LUaNC1vSYylhjozCfmpiu6MD6ZIu5wyE9bKtinlmdtd8MsPpOH51mUltzi/exec',
            ITEMS_PER_PAGE: 25,
            MAX_MODELOS: 10,
            COLORS: {
                primary: '#0077b6',
                secondary: '#00b4d8',
                success: '#2a9d8f',
                warning: '#e9c46a',
                danger: '#e76f51',
                dark: '#0d1b2a',
                light: '#f8f9fa'
            },
            CHART_COLORS: [
                '#0077b6', '#00b4d8', '#2a9d8f', '#e9c46a', '#e76f51',
                '#9d4edd', '#ff9e00', '#06d6a0', '#118ab2', '#ef476f'
            ]
        };

        // Estado da aplicação
        this.state = {
            data: [],
            filteredData: [],
            currentPage: 1,
            itemsPerPage: this.config.ITEMS_PER_PAGE,
            sortConfig: { field: 'data', direction: 'desc' },
            filters: {
                search: '',
                fabricante: '',
                tecnico: '',
                periodo: '1' // Padrão: Hoje
            },
            fabricantes: [],
            tecnicos: [],
            charts: {}
        };

        // Elementos DOM
        this.elements = {
            // Stats
            totalChecklists: document.getElementById('total-checklists'),
            totalFabricantes: document.getElementById('total-fabricantes'),
            totalTecnicos: document.getElementById('total-tecnicos'),
            totalVeiculos: document.getElementById('total-veiculos'),
            
            // Charts
            modelosChart: document.getElementById('modelosChart'),
            timelineChart: document.getElementById('timelineChart'),
            chartType: document.getElementById('chart-type'),
            timelineRange: document.getElementById('timeline-range'),
            
            // Table
            tableBody: document.getElementById('table-body'),
            searchInput: document.getElementById('search-input'),
            fabricanteFilter: document.getElementById('fabricante-filter'),
            tecnicoFilter: document.getElementById('tecnico-filter'),
            itemsPerPage: document.getElementById('items-per-page'),
            
            // Pagination
            currentItems: document.getElementById('current-items'),
            totalItems: document.getElementById('total-items'),
            currentPage: document.getElementById('current-page'),
            totalPages: document.getElementById('total-pages'),
            prevPage: document.getElementById('prev-page'),
            nextPage: document.getElementById('next-page'),
            
            // Buttons
            exportBtn: document.getElementById('export-btn'),
            periodText: document.getElementById('period-text'),
            
            // Overlay
            loadingOverlay: document.getElementById('loading-overlay')
        };

        // Inicialização
        this.init();
    }

    async init() {
        try {
            this.showLoading();
            this.setupEventListeners();
            
            // Tentar carregar dados da API
            let data = await this.fetchData();
            
            if (data.length === 0) {
                // Usar dados de demonstração se API vazia
                data = this.generateDemoData();
                this.showNotification('Usando dados de demonstração', 'warning');
            }
            
            this.state.data = this.processData(data);
            this.applyFilters();
            this.updateUI();
            
            setTimeout(() => {
                this.hideLoading();
                this.showNotification('Dashboard carregado com sucesso', 'success');
            }, 500);
            
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.handleError(error);
        }
    }

    async fetchData() {
        try {
            const response = await fetch(this.config.API_URL);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            return Array.isArray(data) ? data : [];
            
        } catch (error) {
            console.warn('Erro ao buscar dados da API:', error);
            return [];
        }
    }

    processData(data) {
        return data.map((item, index) => ({
            id: index + 1,
            data: item.DATAENTRADA || item.data || new Date().toISOString(),
            placa: item.PLACA || item.placa || `ABC${String(index + 1000).padStart(4, '0')}`,
            modelo: item.MODELO || item.modelo || 'Modelo não informado',
            fabricante: item.FABRICANTE || item.fabricante || 'Fabricante não informado',
            tecnico: item.TECNICO_LOGADO || item.TECNICO || item.tecnico || 'Técnico não informado',
            status: this.generateStatus()
        })).sort((a, b) => new Date(b.data) - new Date(a.data));
    }

    generateDemoData() {
        const fabricantes = ['Volkswagen', 'Fiat', 'Ford', 'Chevrolet', 'Toyota', 'Honda', 'Hyundai', 'Renault'];
        const modelos = {
            'Volkswagen': ['Gol', 'Polo', 'Virtus', 'T-Cross', 'Nivus', 'Jetta'],
            'Fiat': ['Uno', 'Argo', 'Cronos', 'Mobi', 'Toro', 'Strada'],
            'Ford': ['Ka', 'Fiesta', 'EcoSport', 'Ranger', 'Territory'],
            'Chevrolet': ['Onix', 'Prisma', 'Tracker', 'S10', 'Spin'],
            'Toyota': ['Corolla', 'Hilux', 'Yaris', 'SW4', 'RAV4'],
            'Honda': ['Civic', 'Fit', 'HR-V', 'City', 'Accord'],
            'Hyundai': ['HB20', 'Creta', 'Tucson', 'ix35', 'Santa Fe'],
            'Renault': ['Kwid', 'Sandero', 'Logan', 'Duster', 'Captur']
        };
        const tecnicos = ['Carlos Silva', 'Ana Santos', 'Pedro Costa', 'Mariana Lima', 'Roberto Alves', 'Fernanda Rocha'];
        
        const data = [];
        const hoje = new Date();
        
        for (let i = 0; i < 120; i++) {
            const fabricante = fabricantes[Math.floor(Math.random() * fabricantes.length)];
            const modeloList = modelos[fabricante];
            const modelo = modeloList[Math.floor(Math.random() * modeloList.length)];
            
            const dataItem = new Date(hoje);
            dataItem.setDate(hoje.getDate() - Math.floor(Math.random() * 90));
            dataItem.setHours(Math.floor(Math.random() * 24));
            dataItem.setMinutes(Math.floor(Math.random() * 60));
            
            data.push({
                DATAENTRADA: dataItem.toISOString(),
                PLACA: `${['ABC', 'DEF', 'GHI', 'JKL'][Math.floor(Math.random() * 4)]}${String(Math.floor(Math.random() * 9000) + 1000)}`,
                MODELO: modelo,
                FABRICANTE: fabricante,
                TECNICO_LOGADO: tecnicos[Math.floor(Math.random() * tecnicos.length)]
            });
        }
        
        // Adicionar alguns registros de hoje
        for (let i = 0; i < 5; i++) {
            const fabricante = fabricantes[Math.floor(Math.random() * fabricantes.length)];
            const modeloList = modelos[fabricante];
            const modelo = modeloList[Math.floor(Math.random() * modeloList.length)];
            
            const agora = new Date();
            agora.setHours(Math.floor(Math.random() * 8) + 8); // Entre 8h e 16h
            
            data.push({
                DATAENTRADA: agora.toISOString(),
                PLACA: `${['XYZ', 'MNO', 'PQR', 'STU'][Math.floor(Math.random() * 4)]}${String(Math.floor(Math.random() * 9000) + 1000)}`,
                MODELO: modelo,
                FABRICANTE: fabricante,
                TECNICO_LOGADO: tecnicos[Math.floor(Math.random() * tecnicos.length)]
            });
        }
        
        return data;
    }

    generateStatus() {
        const statuses = [
            { type: 'completed', label: 'Concluído', icon: 'check-circle', probability: 0.7 },
            { type: 'progress', label: 'Em Andamento', icon: 'sync-alt', probability: 0.2 },
            { type: 'pending', label: 'Pendente', icon: 'clock', probability: 0.1 }
        ];
        
        let random = Math.random();
        let cumulative = 0;
        
        for (const status of statuses) {
            cumulative += status.probability;
            if (random <= cumulative) {
                return status;
            }
        }
        
        return statuses[0];
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
        
        // Filtro por fabricante
        if (this.state.filters.fabricante) {
            filtered = filtered.filter(item => item.fabricante === this.state.filters.fabricante);
        }
        
        // Filtro por técnico
        if (this.state.filters.tecnico) {
            filtered = filtered.filter(item => item.tecnico === this.state.filters.tecnico);
        }
        
        // Filtro por período
        if (this.state.filters.periodo && this.state.filters.periodo !== 'todos') {
            const hoje = new Date();
            
            if (this.state.filters.periodo === '1') {
                // Filtro "Hoje" - apenas registros do dia atual
                const inicioDia = new Date(hoje);
                inicioDia.setHours(0, 0, 0, 0);
                const fimDia = new Date(hoje);
                fimDia.setHours(23, 59, 59, 999);
                
                filtered = filtered.filter(item => {
                    try {
                        const itemDate = new Date(item.data);
                        return itemDate >= inicioDia && itemDate <= fimDia;
                    } catch {
                        return false;
                    }
                });
            } else {
                // Outros períodos
                const dias = parseInt(this.state.filters.periodo);
                const limite = new Date(hoje);
                limite.setDate(limite.getDate() - dias + 1); // +1 para incluir hoje
                limite.setHours(0, 0, 0, 0);
                
                filtered = filtered.filter(item => {
                    try {
                        const itemDate = new Date(item.data);
                        return itemDate >= limite;
                    } catch {
                        return false;
                    }
                });
            }
        }
        
        // Ordenação
        this.sortData(filtered);
        
        this.state.filteredData = filtered;
        this.updateFiltersDropdowns();
    }

    sortData(data) {
        const { field, direction } = this.state.sortConfig;
        
        data.sort((a, b) => {
            let aValue = a[field];
            let bValue = b[field];
            
            if (field === 'data') {
                aValue = new Date(aValue);
                bValue = new Date(bValue);
            } else {
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();
            }
            
            if (aValue < bValue) return direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    updateUI() {
        this.updateStats();
        this.updateTable();
        this.updateCharts();
        this.updatePagination();
    }

    updateStats() {
        const total = this.state.data.length;
        const fabricantes = [...new Set(this.state.data.map(d => d.fabricante))].length;
        const tecnicos = [...new Set(this.state.data.map(d => d.tecnico))].length;
        const veiculos = [...new Set(this.state.data.map(d => d.placa))].length;
        
        this.elements.totalChecklists.textContent = total.toLocaleString('pt-BR');
        this.elements.totalFabricantes.textContent = fabricantes.toLocaleString('pt-BR');
        this.elements.totalTecnicos.textContent = tecnicos.toLocaleString('pt-BR');
        this.elements.totalVeiculos.textContent = veiculos.toLocaleString('pt-BR');
    }

    updateFiltersDropdowns() {
        // Fabricantes
        const fabricantes = ['', ...new Set(this.state.data.map(d => d.fabricante).filter(Boolean))];
        this.elements.fabricanteFilter.innerHTML = fabricantes.map(f => 
            `<option value="${f}" ${f === this.state.filters.fabricante ? 'selected' : ''}>
                ${f || 'Todos fabricantes'}
            </option>`
        ).join('');
        
        // Técnicos
        const tecnicos = ['', ...new Set(this.state.data.map(d => d.tecnico).filter(Boolean))];
        this.elements.tecnicoFilter.innerHTML = tecnicos.map(t => 
            `<option value="${t}" ${t === this.state.filters.tecnico ? 'selected' : ''}>
                ${t || 'Todos técnicos'}
            </option>`
        ).join('');
    }

    updateTable() {
        const startIndex = (this.state.currentPage - 1) * this.state.itemsPerPage;
        const endIndex = startIndex + this.state.itemsPerPage;
        const pageData = this.state.filteredData.slice(startIndex, endIndex);
        
        if (pageData.length === 0) {
            this.elements.tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-data" style="text-align: center; padding: 60px 20px;">
                        <i class="fas fa-search" style="font-size: 48px; color: #adb5bd; margin-bottom: 20px;"></i>
                        <p style="color: #6c757d; font-size: 16px; margin-bottom: 20px;">
                            Nenhum checklist encontrado com os filtros atuais
                        </p>
                        <button onclick="dashboard.resetFilters()" class="btn-primary" style="padding: 10px 20px; font-size: 14px;">
                            <i class="fas fa-redo"></i> Limpar Filtros
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        this.elements.tableBody.innerHTML = pageData.map(item => {
            const itemDate = new Date(item.data);
            const hoje = new Date();
            const isHoje = itemDate.toDateString() === hoje.toDateString();
            
            return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <i class="far fa-calendar" style="color: ${isHoje ? '#e76f51' : '#0077b6'};"></i>
                        <span>${this.formatDate(item.data)}</span>
                        ${isHoje ? '<span style="background: #e76f51; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600;">HOJE</span>' : ''}
                    </div>
                </td>
                <td>
                    <span style="background: #e9ecef; padding: 6px 12px; border-radius: 20px; font-family: monospace; font-weight: 600;">
                        ${item.placa}
                    </span>
                </td>
                <td>
                    <strong style="display: block; color: #212529;">${item.modelo}</strong>
                    <small style="color: #6c757d; font-size: 12px;">${item.fabricante}</small>
                </td>
                <td>${item.fabricante}</td>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #0077b6, #00b4d8); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600;">
                            ${item.tecnico.charAt(0)}
                        </div>
                        <div>
                            <strong style="display: block; font-size: 14px;">${item.tecnico}</strong>
                            <small style="color: #6c757d; font-size: 12px;">Técnico</small>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${item.status.type}" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                        <i class="fas fa-${item.status.icon}"></i>
                        ${item.status.label}
                    </span>
                </td>
                <td>
                    <button class="view-btn" onclick="dashboard.viewDetails(${item.id})" style="background: none; border: 1px solid #dee2e6; padding: 6px 12px; border-radius: 6px; cursor: pointer; color: #0077b6; font-size: 12px;">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                </td>
            </tr>
        `}).join('');
    }

    updateCharts() {
        this.createModelosChart();
        this.createTimelineChart();
    }

    createModelosChart() {
        if (this.state.charts.modelos) {
            this.state.charts.modelos.destroy();
        }
        
        const ctx = this.elements.modelosChart.getContext('2d');
        const contagem = {};
        
        this.state.filteredData.forEach(d => {
            const modelo = d.modelo;
            contagem[modelo] = (contagem[modelo] || 0) + 1;
        });
        
        const sorted = Object.entries(contagem)
            .sort((a, b) => b[1] - a[1])
            .slice(0, this.config.MAX_MODELOS);
        
        const chartType = this.elements.chartType.value;
        
        const isCircular = chartType === 'pie' || chartType === 'doughnut';
        
        this.state.charts.modelos = new Chart(ctx, {
            type: chartType,
            data: {
                labels: sorted.map(([modelo]) => modelo),
                datasets: [{
                    label: 'Quantidade de Checklists',
                    data: sorted.map(([, qtd]) => qtd),
                    backgroundColor: isCircular 
                        ? this.config.CHART_COLORS.slice(0, sorted.length)
                        : this.config.COLORS.primary,
                    borderColor: isCircular 
                        ? '#ffffff' 
                        : this.config.COLORS.secondary,
                    borderWidth: 2,
                    borderRadius: chartType === 'bar' ? 6 : 0,
                    hoverBackgroundColor: isCircular
                        ? this.config.CHART_COLORS.map(c => this.lightenColor(c, 20))
                        : this.config.COLORS.secondary
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: isCircular ? 'right' : 'top',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(13, 27, 42, 0.9)',
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        padding: 12,
                        cornerRadius: 6,
                        displayColors: isCircular
                    }
                },
                scales: isCircular ? {} : {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            precision: 0,
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            maxRotation: 45
                        }
                    }
                }
            }
        });
    }

    createTimelineChart() {
        if (this.state.charts.timeline) {
            this.state.charts.timeline.destroy();
        }
        
        const ctx = this.elements.timelineChart.getContext('2d');
        const dias = parseInt(this.elements.timelineRange.value);
        
        const dadosPorData = {};
        const hoje = new Date();
        
        // Inicializar últimos N dias
        for (let i = dias - 1; i >= 0; i--) {
            const data = new Date(hoje);
            data.setDate(hoje.getDate() - i);
            const dataStr = data.toLocaleDateString('pt-BR');
            dadosPorData[dataStr] = 0;
        }
        
        // Contar checklists por data
        this.state.filteredData.forEach(d => {
            try {
                const dataItem = new Date(d.data);
                const dataStr = dataItem.toLocaleDateString('pt-BR');
                const dataChart = new Date(dataStr.split('/').reverse().join('-'));
                const limite = new Date(hoje);
                limite.setDate(hoje.getDate() - dias + 1); // +1 para incluir hoje
                
                if (dataChart >= limite && dataChart <= hoje) {
                    dadosPorData[dataStr] = (dadosPorData[dataStr] || 0) + 1;
                }
            } catch (e) {
                console.warn('Data inválida:', d.data);
            }
        });
        
        // Ordenar por data
        const sorted = Object.entries(dadosPorData)
            .sort((a, b) => new Date(a[0].split('/').reverse().join('-')) - new Date(b[0].split('/').reverse().join('-')));
        
        const labels = sorted.map(([data]) => {
            const date = new Date(data.split('/').reverse().join('-'));
            const isHoje = date.toDateString() === hoje.toDateString();
            
            if (isHoje && dias === 1) {
                return 'Hoje';
            } else if (isHoje) {
                return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }) + ' (Hoje)';
            } else {
                return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
            }
        });

        // Adicionar destaque visual para "Hoje" se existir no gráfico
        const chartContainer = this.elements.timelineChart.closest('.chart-wrapper');
        let highlight = chartContainer.querySelector('.today-highlight');
        
        const hojeStr = hoje.toLocaleDateString('pt-BR');
        const checklistsHoje = dadosPorData[hojeStr] || 0;
        
        if (checklistsHoje > 0) {
            if (!highlight) {
                highlight = document.createElement('div');
                highlight.className = 'today-highlight';
                chartContainer.insertBefore(highlight, this.elements.timelineChart);
            }
            highlight.innerHTML = `<i class="fas fa-calendar-day"></i> Hoje: ${checklistsHoje} checklist${checklistsHoje !== 1 ? 's' : ''}`;
        } else if (highlight) {
            highlight.remove();
        }
        
        this.state.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Checklists por Dia',
                    data: sorted.map(([, qtd]) => qtd),
                    backgroundColor: 'rgba(0, 119, 182, 0.1)',
                    borderColor: this.config.COLORS.primary,
                    borderWidth: 3,
                    pointBackgroundColor: this.config.COLORS.primary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(13, 27, 42, 0.9)',
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        padding: 12,
                        cornerRadius: 6,
                        callbacks: {
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                const hojeIndex = labels.findIndex(l => l.includes('Hoje'));
                                
                                if (hojeIndex === context.dataIndex) {
                                    return `${label}: ${value} (HOJE)`;
                                }
                                return `${label}: ${value}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        },
                        ticks: {
                            precision: 0,
                            font: {
                                size: 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            }
                        }
                    }
                }
            }
        });
    }

    updatePagination() {
        const totalItems = this.state.filteredData.length;
        const totalPages = Math.ceil(totalItems / this.state.itemsPerPage);
        const currentItems = Math.min(this.state.itemsPerPage, totalItems - (this.state.currentPage - 1) * this.state.itemsPerPage);
        
        this.elements.currentItems.textContent = currentItems.toLocaleString('pt-BR');
        this.elements.totalItems.textContent = totalItems.toLocaleString('pt-BR');
        this.elements.currentPage.textContent = this.state.currentPage;
        this.elements.totalPages.textContent = totalPages || 1;
        
        this.elements.prevPage.disabled = this.state.currentPage <= 1;
        this.elements.nextPage.disabled = this.state.currentPage >= totalPages || totalPages === 0;
    }

    setupEventListeners() {
        // Busca
        this.elements.searchInput.addEventListener('input', this.debounce((e) => {
            this.state.filters.search = e.target.value.trim();
            this.state.currentPage = 1;
            this.applyFilters();
            this.updateUI();
        }, 300));
        
        // Filtros
        this.elements.fabricanteFilter.addEventListener('change', (e) => {
            this.state.filters.fabricante = e.target.value;
            this.state.currentPage = 1;
            this.applyFilters();
            this.updateUI();
        });
        
        this.elements.tecnicoFilter.addEventListener('change', (e) => {
            this.state.filters.tecnico = e.target.value;
            this.state.currentPage = 1;
            this.applyFilters();
            this.updateUI();
        });
        
        // Itens por página
        this.elements.itemsPerPage.addEventListener('change', (e) => {
            this.state.itemsPerPage = parseInt(e.target.value);
            this.state.currentPage = 1;
            this.updateTable();
            this.updatePagination();
        });
        
        // Paginação
        this.elements.prevPage.addEventListener('click', () => {
            if (this.state.currentPage > 1) {
                this.state.currentPage--;
                this.updateTable();
                this.updatePagination();
            }
        });
        
        this.elements.nextPage.addEventListener('click', () => {
            const totalPages = Math.ceil(this.state.filteredData.length / this.state.itemsPerPage);
            if (this.state.currentPage < totalPages) {
                this.state.currentPage++;
                this.updateTable();
                this.updatePagination();
            }
        });
        
        // Ordenação da tabela
        document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                const direction = this.state.sortConfig.field === field && this.state.sortConfig.direction === 'asc' ? 'desc' : 'asc';
                
                this.state.sortConfig = { field, direction };
                this.applyFilters();
                this.updateUI();
                this.updateSortIndicators();
            });
        });
        
        // Gráficos
        this.elements.chartType.addEventListener('change', () => {
            this.createModelosChart();
        });
        
        this.elements.timelineRange.addEventListener('change', () => {
            // Sincronizar com filtro de período
            const value = this.elements.timelineRange.value;
            this.state.filters.periodo = value;
            
            // Atualizar texto do período
            this.updatePeriodText(value);
            
            this.state.currentPage = 1;
            this.applyFilters();
            this.updateUI();
        });
        
        // Exportar
        this.elements.exportBtn.addEventListener('click', () => {
            this.exportData();
        });
        
        // Selecionar período
        const periodSelector = document.querySelector('.period-selector');
        periodSelector.addEventListener('click', () => {
            this.showPeriodSelector();
        });
    }

    updatePeriodText(value) {
        const periodos = {
            '1': 'Hoje',
            '7': 'Últimos 7 dias',
            '15': 'Últimos 15 dias',
            '30': 'Últimos 30 dias',
            '90': 'Últimos 90 dias',
            'todos': 'Todo o período'
        };
        
        this.elements.periodText.textContent = periodos[value] || 'Hoje';
    }

    updateSortIndicators() {
        document.querySelectorAll('.data-table th i').forEach(icon => {
            icon.className = 'fas fa-sort';
        });
        
        const th = document.querySelector(`.data-table th[data-sort="${this.state.sortConfig.field}"]`);
        if (th) {
            const icon = th.querySelector('i');
            if (icon) {
                icon.className = this.state.sortConfig.direction === 'asc' 
                    ? 'fas fa-sort-up' 
                    : 'fas fa-sort-down';
            }
        }
    }

    showPeriodSelector() {
        const periodos = [
            { dias: 1, label: 'Hoje' },
            { dias: 7, label: 'Últimos 7 dias' },
            { dias: 15, label: 'Últimos 15 dias' },
            { dias: 30, label: 'Últimos 30 dias' },
            { dias: 90, label: 'Últimos 90 dias' },
            { dias: 'todos', label: 'Todo o período' }
        ];
        
        // Criar overlay de seleção
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 24px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        `;
        
        modal.innerHTML = `
            <h3 style="margin-bottom: 20px; color: #0d1b2a;">Selecionar Período</h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${periodos.map(p => `
                    <button class="period-option" data-dias="${p.dias}" style="
                        padding: 12px 16px;
                        border: 1px solid #e9ecef;
                        border-radius: 8px;
                        background: ${this.state.filters.periodo === p.dias.toString() ? '#0077b6' : 'white'};
                        color: ${this.state.filters.periodo === p.dias.toString() ? 'white' : '#212529'};
                        cursor: pointer;
                        text-align: left;
                        font-weight: 500;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                    ">
                        ${p.label}
                        ${p.dias === '1' ? '<span style="background: #e76f51; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px;">HOJE</span>' : ''}
                    </button>
                `).join('')}
            </div>
            <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                <button id="cancel-period" style="
                    padding: 10px 20px;
                    border: 1px solid #e9ecef;
                    border-radius: 6px;
                    background: white;
                    color: #6c757d;
                    cursor: pointer;
                    margin-right: 10px;
                ">
                    Cancelar
                </button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Event listeners
        modal.querySelectorAll('.period-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dias = e.target.dataset.dias;
                this.state.filters.periodo = dias;
                this.state.currentPage = 1;
                
                // Atualizar texto do período
                this.updatePeriodText(dias);
                
                // Sincronizar com gráfico
                if (dias !== 'todos') {
                    this.elements.timelineRange.value = dias;
                }
                
                this.applyFilters();
                this.updateUI();
                overlay.remove();
            });
        });
        
        overlay.querySelector('#cancel-period').addEventListener('click', () => {
            overlay.remove();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    exportData() {
        const dataToExport = this.state.filteredData.length > 0 ? this.state.filteredData : this.state.data;
        
        if (dataToExport.length === 0) {
            this.showNotification('Nenhum dado para exportar', 'warning');
            return;
        }
        
        // Criar CSV
        const headers = ['ID', 'Data', 'Placa', 'Modelo', 'Fabricante', 'Técnico', 'Status'];
        const csvRows = [
            headers.join(','),
            ...dataToExport.map(item => [
                item.id,
                `"${this.formatDate(item.data)}"`,
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
        
        // Criar link de download
        const link = document.createElement('a');
        link.href = url;
        link.download = `checklists_all_motors_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showNotification('Exportação realizada com sucesso!', 'success');
    }

    resetFilters() {
        this.state.filters = {
            search: '',
            fabricante: '',
            tecnico: '',
            periodo: '1' // Padrão: Hoje
        };
        
        this.elements.searchInput.value = '';
        this.state.currentPage = 1;
        this.elements.periodText.textContent = 'Hoje';
        this.elements.timelineRange.value = '1';
        
        this.applyFilters();
        this.updateUI();
        this.showNotification('Filtros resetados', 'success');
    }

    viewDetails(id) {
        const item = this.state.data.find(d => d.id === id);
        if (!item) return;
        
        // Criar modal de detalhes
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        `;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 30px;
            width: 90%;
            max-width: 600px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            max-height: 80vh;
            overflow-y: auto;
        `;
        
        const itemDate = new Date(item.data);
        const isHoje = itemDate.toDateString() === new Date().toDateString();
        
        modal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="color: #0d1b2a; margin: 0;">Detalhes do Checklist #${item.id}</h3>
                <button id="close-details" style="background: none; border: none; color: #6c757d; cursor: pointer; font-size: 18px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
                <div>
                    <h4 style="color: #6c757d; font-size: 12px; margin-bottom: 5px;">DATA</h4>
                    <p style="font-size: 16px; font-weight: 500; color: #212529;">
                        ${this.formatDate(item.data)}
                        ${isHoje ? '<span style="background: #e76f51; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px; margin-left: 10px;">HOJE</span>' : ''}
                    </p>
                </div>
                <div>
                    <h4 style="color: #6c757d; font-size: 12px; margin-bottom: 5px;">PLACA</h4>
                    <p style="font-size: 16px; font-weight: 500; color: #212529; font-family: monospace; background: #f8f9fa; padding: 8px 12px; border-radius: 6px;">${item.placa}</p>
                </div>
                <div>
                    <h4 style="color: #6c757d; font-size: 12px; margin-bottom: 5px;">MODELO</h4>
                    <p style="font-size: 16px; font-weight: 500; color: #212529;">${item.modelo}</p>
                </div>
                <div>
                    <h4 style="color: #6c757d; font-size: 12px; margin-bottom: 5px;">FABRICANTE</h4>
                    <p style="font-size: 16px; font-weight: 500; color: #212529;">${item.fabricante}</p>
                </div>
                <div>
                    <h4 style="color: #6c757d; font-size: 12px; margin-bottom: 5px;">TÉCNICO</h4>
                    <p style="font-size: 16px; font-weight: 500; color: #212529;">${item.tecnico}</p>
                </div>
                <div>
                    <h4 style="color: #6c757d; font-size: 12px; margin-bottom: 5px;">STATUS</h4>
                    <span class="status-badge status-${item.status.type}" style="display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                        <i class="fas fa-${item.status.icon}"></i>
                        ${item.status.label}
                    </span>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h4 style="color: #6c757d; font-size: 12px; margin-bottom: 10px;">AÇÕES RÁPIDAS</h4>
                <div style="display: flex; gap: 10px;">
                    <button onclick="dashboard.printChecklist(${item.id})" style="background: #0077b6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                        <i class="fas fa-print"></i> Imprimir
                    </button>
                    <button onclick="dashboard.shareChecklist(${item.id})" style="background: #2a9d8f; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
                        <i class="fas fa-share"></i> Compartilhar
                    </button>
                </div>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Event listeners
        overlay.querySelector('#close-details').addEventListener('click', () => {
            overlay.remove();
        });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    printChecklist(id) {
        this.showNotification('Função de impressão em desenvolvimento', 'info');
    }

    shareChecklist(id) {
        this.showNotification('Função de compartilhamento em desenvolvimento', 'info');
    }

    formatDate(dateStr) {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateStr;
        }
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

    lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        
        return '#' + (
            0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    showNotification(message, type = 'info', duration = 5000) {
        // Remover notificação anterior
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Fechar notificação
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-remover
        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.style.animation = 'slideOut 0.3s ease';
                    setTimeout(() => notification.remove(), 300);
                }
            }, duration);
        }
    }

    showLoading() {
        this.elements.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.elements.loadingOverlay.style.display = 'none';
    }

    handleError(error) {
        this.showNotification(`Erro: ${error.message}`, 'error');
        this.hideLoading();
        
        // Usar dados de demonstração em caso de erro
        const demoData = this.generateDemoData();
        this.state.data = this.processData(demoData);
        this.applyFilters();
        this.updateUI();
        
        setTimeout(() => {
            this.hideLoading();
            this.showNotification('Carregando dados de demonstração', 'warning');
        }, 500);
    }
}

// Inicializar dashboard quando o DOM estiver carregado
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    window.dashboard = dashboard; // Expor globalmente para usar em onclick
});

// Adicionar animação para slideOut
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);