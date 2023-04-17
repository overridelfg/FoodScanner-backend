module.exports = {
    server: {
        port: 8080,
        jwt: {
            secret: "youdontstealmypassword",
            tokens:{
                access: {
                    type: 'access',
                    expiresIn: '2m',
                },
                refresh: {
                    type: 'refresh',
                    expiresIn: '3m',
                }
            }
        },
    },
    database:{
        mongoUri: 'mongodb+srv://override:minelego2002@cluster0.afiyjyf.mongodb.net/foodscanner_db?retryWrites=true&w=majority'
    }
}