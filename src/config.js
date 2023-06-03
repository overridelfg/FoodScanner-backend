const PORT = process.env.PORT || 3000

module.exports = {
    server: {
        port: PORT,
        jwt: {
            secret: "youdontstealmypassword",
            tokens:{
                access: {
                    type: 'access',
                    expiresIn: '1h',
                },
                refresh: {
                    type: 'refresh',
                    expiresIn: '24h',
                }
            }
        },
    },
    database:{
        mongoUri: 'mongodb+srv://override:minelego2002@cluster0.afiyjyf.mongodb.net/foodscanner_db?retryWrites=true&w=majority'
    }
}