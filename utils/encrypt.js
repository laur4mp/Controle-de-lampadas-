const bcrypt = require('bcrypt')

const encrypt = async(senha) => {
    return await bcrypt.hash(senha, 10)
}

module.exports = { encrypt }