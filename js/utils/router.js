const Router = {
    routes: {
        '/': 'home.html',
        '/event-details': 'event-details.html',
        '/editor': 'editor.html'
    },

    navigate(path) {
        const route = this.routes[path];
        if (route) {
            window.location.href = route;
        } else {
            console.error('Route not found:', path);
        }
    }
};