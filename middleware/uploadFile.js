const multer = require('multer')

module.exports = (imageFile) =>{
    const storage = multer.diskStorage({
        destination: (req, file, cb)=>{
            cb(null, 'uploads')
        },
        filename: (req, file, cb) =>{
            cb(null, Date.now() + '-' + file.originalname.replace(/\s/g,''))
        }
    })

    const fileFilter = (req, file, cb) =>{
        if(file.filename === imageFile){
            if(!file.originalname.match(/\.(jpg|JPF|png|jpeg)$/)){
                req.fileValidationError = {
                    message : 'Only  image file allowed'
                }
                return cb(new Error('Only  image file allowed', false))
            }
        }
        cb(null, true)
    }
    const sizeInMB = 10
    const maxSize = sizeInMB * 1000 * 1000

    const upload = multer({
        storage,
        fileFilter,
        limits : {
            fileSize : maxSize
        }
    }).single(imageFile)

    return (req, res, next)=>{
        upload(req, res, (err)=>{
            if(req.fileValidationError){
                req.session.message ={
                    type: 'danger',
                    message: 'please select file'
                }
                 return res.redirect(req.originalUrl)
            }
            if(err){
                if(err.code === 'LIMIT_FILE_SIZE'){
                    req.session.message ={
                        type: 'danger',
                        message: 'please select file'
                    }
                 return res.redirect(req.originalUrl)
                }
                req.session.message = {
                    type : 'danger',
                    message: err
                }
                return res.redirect(req.originalUrl)
            }
            return next()
        })
    }
}