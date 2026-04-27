#include <iostream>
#include <unordered_map>
#include <vector>
#include <map>

using namespace std;

class User
{
private:
    int balance = 0;
    int userId;

public:
    void setID(int id)
    {
        userId = id;
    }
    int getBalance()
    {
        return balance;
    }
    void updateBalance(int newVal)
    {
        balance = newVal;
    }
};

class Transaction
{
public:
    User userA;
    User userB;
    int amount = 0;

    Transaction(User a, User b, int amt)
    {
        userA = a;
        userB = b;
        amount = amt;
    }

    string transfer()
    {
        if (userA.getBalance() < amount)
        {
            return "FAILED";
        }
        userA.updateBalance(userA.getBalance() - amount);
        userB.updateBalance(userB.getBalance() + amount);
        return "SUCCESS";
    }
};

map<int, User> userTable;
int userIt = 1;

int main()
{
    User a;
    a.setID(userIt++);
    a.updateBalance(1000);

    User b;
    b.setID(userIt++);
    b.updateBalance(1000);

    Transaction txn(a, b, 100);
    txn.transfer();

    User c;
    c.updateBalance(1000);
}