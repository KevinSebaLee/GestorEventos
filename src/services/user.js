import UsersManager from '../repos/user.js';

const repo = new UsersManager();

const getUserParameters = async(id, username) => {
    const user = await repo.getUserParameters(id, username);

    return user;
}

const createUser = async({username, password, firstName, lastName }) => {
    const user = await repo.createUser({ username, password, firstName, lastName });

    return user;
}

export default { getUserParameters, createUser };
