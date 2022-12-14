
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wsServer = new WebSocket.Server({ server });

const Redis = require('ioredis');
const redis = new Redis({
    host: 'redis-15992.c264.ap-south-1-1.ec2.cloud.redislabs.com',
    port: 15992,
    password: 'W7W01RBeNXYz6xtEdwVhzC7xTn71KblD'
});







const mongoose = require('mongoose');
mongoose.set('strictQuery', true);
mongoose.connect('mongodb+srv://backend-task:LZwz8vtxZyVYFsYe@freecluster.qqan4im.mongodb.net/backend_tasks');



const Todos = mongoose.model('todos', { todos: Array });

const moveToMongoAndFlush = (todoArr) => {
    const todos = new Todos({ todos: todoArr });
    todos.save().then(() => {
        redis.flushdb(function (err, succeeded) {
            console.log(succeeded);
        });
    });
}

wsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
        const { type, todo } = JSON.parse(message.toString());
        switch (type) {
            case 'add':
                redis.get('BACKEND_TASK_NAYAZ', (err, data) => {
                    if (data) {
                        let todoArr = JSON.parse(data);
                        todoArr.push(todo);
                        if (todoArr.length > 50) {
                            moveToMongoAndFlush(todoArr);
                        }
                        else redis.set('BACKEND_TASK_NAYAZ', JSON.stringify(todoArr));
                    }
                    else redis.set('BACKEND_TASK_NAYAZ', JSON.stringify([todo]));
                })
                break;
            default:
                socket.send("Invalid Event");
        }
    });

    socket.send('You are connected with WebSocket server');
});

app.get('/fetchAllTasks', (req, res) => {
    Todos.find().then(data => {
        let todos = [];
        data.forEach(entry => {
            todos = [...todos, ...entry.todos];
        })
        res.send(todos);
    })
})

server.listen(process.env.PORT || 2000, () => {
    console.log(`Server started on port ${server.address().port} :)`);
});