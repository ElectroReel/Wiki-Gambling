class WikiManager {
    constructor() {
        this.currentPage = 'accueil';
        this.cache = new Map();
        this.contentArea = document.querySelector('.content-area');
        this.spinner = document.querySelector('.loading-spinner');
        this.init();
    }

    init() {
        // Attacher les événements de navigation pour les liens normaux
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.loadPage(page, link);
            });
        });

        // Attacher les événements pour les headers de catégorie
        document.querySelectorAll('.category-header').forEach(header => {
            // Séparer le comportement du header et de la flèche
            const categoryIcon = header.querySelector('.category-icon');
            const categoryContent = header.querySelector('span:first-child');
            
            // Événement pour la flèche (toggle uniquement)
            if (categoryIcon) {
                categoryIcon.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Empêcher la propagation vers le header
                    this.toggleCategory(header);
                });
            }

            // Événement pour le contenu du header (charger page + toggle)
            if (categoryContent) {
                categoryContent.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Charger la page correspondante
                    const categoryId = header.getAttribute('data-category');
                    if (categoryId) {
                        this.loadPage(categoryId, header);
                        this.updateCategoryNavigation(header);
                    }
                    
                    // Déplier automatiquement la catégorie
                    if (!header.classList.contains('expanded')) {
                        this.toggleCategory(header);
                    }
                });
            }

            // Événement pour le header complet (fallback)
            header.addEventListener('click', (e) => {
                // Si le clic n'est pas sur la flèche ou le contenu, comportement par défaut
                if (!e.target.classList.contains('category-icon') && 
                    !e.target.matches('span:first-child')) {
                    
                    const categoryId = header.getAttribute('data-category');
                    if (categoryId) {
                        this.loadPage(categoryId, header);
                        this.updateCategoryNavigation(header);
                    }
                    
                    if (!header.classList.contains('expanded')) {
                        this.toggleCategory(header);
                    }
                }
            });
        });
    }

    toggleCategory(header) {
        const category = header.nextElementSibling;
        const isExpanded = header.classList.contains('expanded');

        if (isExpanded) {
            // Fermer la catégorie
            header.classList.remove('expanded');
            category.classList.remove('expanded');
        } else {
            // Ouvrir la catégorie
            header.classList.add('expanded');
            category.classList.add('expanded');
        }
    }

    async loadPage(pageName, linkElement) {
        // Éviter de recharger la même page
        if (pageName === this.currentPage) return;

        try {
            // Mettre à jour la navigation
            this.updateNavigation(linkElement);
            
            // Afficher le spinner
            this.showLoading(true);

            // Charger le contenu
            const content = await this.fetchPageContent(pageName);
            
            // Afficher le contenu
            this.displayContent(content);
            
            this.currentPage = pageName;
            
        } catch (error) {
            this.displayError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async fetchPageContent(pageName) {
        // Vérifier le cache d'abord
        if (this.cache.has(pageName)) {
            return this.cache.get(pageName);
        }

        try {
            // Essayer de charger depuis un fichier externe
            const response = await fetch(`pages/${pageName}.html`);
            
            if (!response.ok) {
                throw new Error(`Page "${pageName}" introuvable`);
            }
            
            const content = await response.text();
            
            // Mettre en cache
            this.cache.set(pageName, content);
            
            return content;
            
        } catch (error) {
            // Si le fichier n'existe pas, utiliser le contenu par défaut
            return this.getDefaultContent(pageName);
        }
    }

    getDefaultContent(pageName) {
        const defaultPages = {
        };

        return defaultPages[pageName] || `
            <h2>Page "${pageName}"</h2>
            <p>Cette page n'existe pas encore. Créez le fichier <code>pages/${pageName}.html</code> pour ajouter du contenu.</p>
        `;
    }

    updateNavigation(activeElement) {
        // Retirer active de tous les liens et headers
        document.querySelectorAll('.nav-link, .category-header').forEach(element => {
            element.classList.remove('active');
        });
        
        // Ajouter active à l'élément cliqué
        activeElement.classList.add('active');
    }

    updateCategoryNavigation(activeHeader) {
        // Retirer active de tous les liens
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        // Retirer active de tous les headers
        document.querySelectorAll('.category-header').forEach(header => {
            header.classList.remove('active');
        });
        
        // Ajouter active au header cliqué
        activeHeader.classList.add('active');
    }

    showLoading(show) {
        if (show) {
            this.spinner.classList.add('show');
        } else {
            this.spinner.classList.remove('show');
        }
    }

    displayContent(content) {
        this.contentArea.innerHTML = content;
        this.contentArea.classList.add('fade-in');
        
        // Retirer l'animation après qu'elle soit terminée
        setTimeout(() => {
            this.contentArea.classList.remove('fade-in');
        }, 400);
    }

    displayError(message) {
        this.contentArea.innerHTML = `
            <div class="error-message">
                <h3>❌ Erreur</h3>
                <p>${message}</p>
            </div>
        `;
    }

    // Méthode pour ajouter une nouvelle page dynamiquement
    addPage(pageName, title, content, categoryName = null) {
        // Ajouter au cache
        this.cache.set(pageName, content);
        
        if (categoryName) {
            // Ajouter à une catégorie existante
            const category = document.querySelector(`[data-category="${categoryName}"]`).nextElementSibling;
            const newNavItem = document.createElement('li');
            newNavItem.className = 'nav-item';
            newNavItem.innerHTML = `
                <a href="#" class="nav-link" data-page="${pageName}">${title}</a>
            `;
            category.appendChild(newNavItem);
            
            // Attacher l'événement
            const newLink = newNavItem.querySelector('.nav-link');
            newLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.loadPage(pageName, newLink);
            });
        } else {
            // Créer une nouvelle catégorie si nécessaire
            this.addCategory(categoryName || 'nouvelle-categorie', '🆕 Nouvelle Catégorie', [
                { page: pageName, title: title }
            ]);
        }
    }

    // Méthode pour ajouter une nouvelle catégorie
    addCategory(categoryId, categoryTitle, pages = []) {
        const navMenu = document.querySelector('.nav-menu');
        const newCategory = document.createElement('li');
        newCategory.className = 'nav-category';
        
        let pagesHtml = '';
        pages.forEach(page => {
            pagesHtml += `
                <li class="nav-item">
                    <a href="#" class="nav-link" data-page="${page.page}">${page.title}</a>
                </li>
            `;
        });
        
        newCategory.innerHTML = `
            <div class="category-header" data-category="${categoryId}">
                <span>${categoryTitle}</span>
                <span class="category-icon">▶</span>
            </div>
            <ul class="category-items">
                ${pagesHtml}
            </ul>
        `;
        
        navMenu.appendChild(newCategory);
        
        // Attacher les événements pour le nouveau header
        const header = newCategory.querySelector('.category-header');
        const categoryIcon = header.querySelector('.category-icon');
        const categoryContent = header.querySelector('span:first-child');
        
        // Événement pour la flèche
        if (categoryIcon) {
            categoryIcon.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleCategory(header);
            });
        }

        // Événement pour le contenu du header
        if (categoryContent) {
            categoryContent.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                this.loadPage(categoryId, header);
                this.updateCategoryNavigation(header);
                
                if (!header.classList.contains('expanded')) {
                    this.toggleCategory(header);
                }
            });
        }
        
        // Attacher les événements aux liens
        newCategory.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.getAttribute('data-page');
                this.loadPage(page, link);
            });
        });
    }
}

// Initialiser le wiki au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    window.wiki = new WikiManager();
});

// Exemple d'utilisation pour ajouter une page dynamiquement
// wiki.addPage('nouvelle-page', '🆕 Nouvelle Page', '<h2>Ma nouvelle page</h2><p>Contenu de la nouvelle page</p>');