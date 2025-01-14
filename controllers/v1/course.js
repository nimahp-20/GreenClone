const courseModel = require('./../../models/course')
const courseUserModel = require('./../../models/course-user')
const sessionModel = require('./../../models/session')
const categoryModel = require('./../../models/category')
const commentModel = require('./../../models/comment')
const mongoose = require("mongoose");

exports.create = async (req, res) => {
    const {name, description, support, href, price, status, discount, categoryId} = req.body;

    if (!req.file) {
        return res.status(400).json({message: "Cover image is required"});
    }

    try {
        const course = await courseModel.create({
            name,
            description,
            creator: req.user._id,
            categoryId,
            status,
            price,
            href,
            discount,
            support,
            cover: req.file.filename,
        });

        const mainCourse = await courseModel.findById(course._id).populate('creator', '-password');
        return res.status(201).json(mainCourse);
    } catch (error) {
        return res.status(500).json({message: 'Internal Server Error', error: error.message});
    }
};

exports.createSession = async (req, res) => {
    const {title, free, time} = req.body
    const {id} = req.params

    const session = await sessionModel.create({
        title, time, free, video: "video.mp4", course: id,
    })

    return res.status(201).json(session)
}

exports.getAllSessions = async (req, res) => {
    const sessions = await sessionModel.find({}).populate('course').lean()
    console.log(sessions)
    return res.status(200).json(sessions)

}

exports.getSessionInfo = async (req, res) => {
    const course = await courseModel.findOne({href: req.params.href})
    const session = await sessionModel.findOne({_id: req.params.sessionID})
    const sessions = await sessionModel.find({course: course._id})

    return res.status(200).json({session, sessions})
}

exports.removeSession = async (req, res) => {
    try {
        const deletedCourse = await sessionModel.findOneAndDelete({_id: req.params.id});
        if (deletedCourse) {
            return res.status(200).json(deletedCourse);
        } else {
            return res.status(404).json({message: 'Course not found'});
        }
    } catch (error) {
        return res.status(500).json({message: 'Internal Server Error', error: error.message});
    }
};

exports.register = async (req, res) => {
    try {
        const isUserAlreadyRegister = await courseUserModel.findOne({
            user: req.user._id, course: req.params.id
        }).lean()
        if (isUserAlreadyRegister) {
            return res.status(409).json({
                message: "userAlreadyRegister",
            })
        } else {
            const register = await courseUserModel.create({
                user: req.user._id, course: req.params.id, price: req.body.price
            })
            return res.status(201).json({
                message: 'Your register Done', data: register
            })
        }
    } catch (error) {
        return res.status(500).json({message: 'Internal Server Error', error: error.message});
    }
};

exports.getCoursesByCategory = async (req, res) => {
    try {

        const category = await categoryModel.findOne({href: req.params.href});

        if (category) {
            console.log(category._id)
            const categoryCourses = await courseModel.find({categoryId: category._id});
            return res.status(200).json({categoryCourses});
        } else {
            return res.json([]);
        }
    } catch (error) {
        return res.status(500).json({message: 'Internal Server Error', error: error.message});
    }
};

exports.getOneCourse = async (req, res, next) => {
    try {
        const course = await courseModel.findOne({href: req.params.href}).select('-__v')
            .populate('creator', '-password -__v')
            .populate('categoryId', '-__v')


        const sessions = await sessionModel.find({course: course._id}).lean().select('-__v')
        const comments = await commentModel.find({course: course._id, isAccept: true}).select('-__v')
            .populate('user', '-password -__v')

        const courseStudentsCount = await courseUserModel.find({course: course._id}).countDocuments()

        const isUserRegisterToThisCourse = !!(await courseUserModel.findOne({
            user: req.user._id,
            course: course._id
        }))

        return res.json({
            course: course,
            sessions: sessions,
            comments: comments,
            courseStudentsCount: courseStudentsCount,
            isUserRegister: isUserRegisterToThisCourse
        })
    } catch (error) {
        return res.status(500).json({message: 'Internal Server Error', error: error.message});
    }
};

exports.remove = async (req, res, next) => {
    try {
        const isObjectIdValid = mongoose.Types.ObjectId.isValid(req.params.id)
        const deletedCourse = await courseModel.findOneAndDelete({_id: req.params.id})

        if (!isObjectIdValid) {
            return res.status(409).json({
                message: "CourseId is not valid"
            })
        }

        if (deletedCourse) {
            return res.status(200).json({
                message: "Course Deleted successfully",
                deletedCourse: deletedCourse
            })
        } else {
            res.status(404).json({
                message: "course not found"
            })
        }
    } catch (error) {
        return res.status(500).json({message: 'Internal Server Error', error: error.message});
    }
};