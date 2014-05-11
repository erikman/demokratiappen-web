/* Copyright (C) 2014 Demokratiappen.
 *
 * This file is part of Demokratiappen.
 *
 * Demokratiappen is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Demokratiappen is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Demokratiappen.  If not, see <http://www.gnu.org/licenses/>.
 */

(function() {
  'use strict';

  var democracyServices = angular.module('democracy.service', [] );

  democracyServices.factory('ParseInitializer', [ function() {
    initDemokratiappen();
  }]);

  democracyServices.factory('LoginService',
     ['$rootScope', 'ParseInitializer',
      function($rootScope) {
    var obj = {
      LOGGED_IN: 0,
      NOT_LOGGED_IN: 1,
      INITIAL: 0,
      LOADING: 1,
      LOGIN_FAILED: 2,
      REGISTRATION_FAILED: 3
    };

    obj.stateLoggedIn = (Parse.User.current() ? obj.LOGGED_IN : obj.NOT_LOGGED_IN);
    obj.stateLoginProcess = obj.INITIAL;

    var setStateLoginProcess = function(newState) {
      obj.stateLoginProcess = newState;
    };

    var setStateLoggedIn = function(newState) {
      obj.stateLoggedIn = newState;

      obj.password = '';
      obj.email = '';
      setStateLoginProcess(obj.INITIAL);
    };

    obj.login = function() {
      setStateLoginProcess(obj.LOADING);

      var loginPromise = new Parse.Promise();
      Parse.User.logIn(
        obj.username,
        obj.password,
        {
          success: function(user) {
            $rootScope.$apply(function() {
              setStateLoggedIn(obj.LOGGED_IN);
            });
            loginPromise.resolve(user);
          },
          error: function(user, error) {
            _.defer(function () {
              $rootScope.$apply(function() {
                setStateLoginProcess(obj.LOGIN_FAILED);
              });
              // Run the callback outside of angular scope updates.
              loginPromise.reject(error);
            });
          }
        });

       return loginPromise;
    };

    obj.loginOrSignupFacebook = function() {
      var loginPromise = new Parse.Promise();

      Parse.FacebookUtils.logIn('email', {
        success: function(user) {
          if (!user.existed()) {
            // User did not exist before, update the ACL on the newly created
            // user object.
            user.setACL(new Parse.ACL());
            user.save().then(function () {
              $rootScope.$apply(function() {
                setStateLoggedIn(obj.LOGGED_IN);
              });
              loginPromise.resolve(user);
            }, function (error) {
              _.defer(function () {
                $rootScope.$apply(function() {
                  setStateLoginProcess(obj.LOGIN_FAILED);
                });
                // Run the callback outside of angular scope updates.
                loginPromise.reject(error);
              });
            });
          }
          else {
            $rootScope.$apply(function() {
              setStateLoggedIn(obj.LOGGED_IN);
            });
            loginPromise.resolve(user);
          }
        },
        error: function(user, error) {
          // Some error checking is done on the client side, so we need to defer
          // execution here so we don't nestle the angular apply calls.
          _.defer(function () {
            $rootScope.$apply(function() {
              setStateLoginProcess(obj.LOGIN_FAILED);
            });
            // Run the callback outside of angular scope updates.
            loginPromise.reject(error);
          });
        }
      });
      return loginPromise;
    };

    obj.signup = function() {
      setStateLoginProcess(obj.LOADING);

      var signupPromise = new Parse.Promise();
      var newUser = new Parse.User();
      newUser.set('username', obj.username);
      newUser.set('password', obj.password);

      if (obj.email && (obj.email.length > 0)) {
        // Only set email if one is provided, otherwise the signup will fail.
        newUser.set('email', obj.email);
      }

      newUser.signUp(
        { ACL: new Parse.ACL() },
        {
          success: function(user) {
            $rootScope.$apply(function () {
              obj.username = user.getUsername();
              setStateLoggedIn(obj.LOGGED_IN);
            });
            signupPromise.resolve(user);
          },
          error: function(user, error) {
            // Some error checking is done on the client side, for instance if
            // the user name is empty, so we need to defer execution here so we
            // don't nestle the angular apply calls.
            _.defer(function () {
              $rootScope.$apply(function() {
                setStateLoginProcess(obj.REGISTRATION_FAILED);
              });
              // Run the callback outside of angular scope updates.
              signupPromise.reject(error);
            });
          }
        });
      return signupPromise;
    };

    obj.logout = function() {
      obj.username = '';
      obj.email = '';

      Parse.User.logOut();
      setStateLoggedIn(obj.NOT_LOGGED_IN);
    };

    obj.username = (Parse.User.current() ? Parse.User.current().getUsername() : '');
    obj.email = '';

    return obj;
  }]);


  /**
   * @brief Service to translate error codes from Parse to the application
   *   language.
   *
   * Currently only swedish is supported.
   */
  democracyServices.factory('ParseErrorService', [ function() {
    var errorCodesSv = { };
    errorCodesSv[Parse.Error.USERNAME_TAKEN] = 'Användarnamnet är upptaget.';
    errorCodesSv[Parse.Error.ACCOUNT_ALREADY_LINKED] = 'Kontot är redan länkat till en annan användare.';
    errorCodesSv[Parse.Error.CACHE_MISS] = 'Cache miss.';
    errorCodesSv[Parse.Error.CONNECTION_FAILED] = 'Anslutningen till servern misslyckades.';
    errorCodesSv[Parse.Error.EMAIL_MISSING] = 'Epost-adress saknas.';
    errorCodesSv[Parse.Error.EMAIL_NOT_FOUND] = 'Epost-adressen hittades inte i databasen.';
    errorCodesSv[Parse.Error.EMAIL_TAKEN] = 'Epost-adressen används redan av ett annat konto.';
    errorCodesSv[Parse.Error.INTERNAL_SERVER_ERROR] = 'Internt server fel, var god försök igen senare.';
    errorCodesSv[Parse.Error.INVALID_EMAIL_ADDRESS] = 'Felaktig epost-adress. Kontrollera formatet på din epost-adress.';
    errorCodesSv[Parse.Error.INVALID_LINKED_SESSION] = 'Fel på facebook kopplingen.';
    errorCodesSv[Parse.Error.LINKED_ID_MISSING] = 'Användarnamnet är kopplad till ett facebook konto med felaktigt id.';
    errorCodesSv[Parse.Error.OBJECT_NOT_FOUND] = 'Hittar inte objektet.';
    errorCodesSv[Parse.Error.PASSWORD_MISSING] = 'Saknar lösenord.';
    errorCodesSv[Parse.Error.TIMEOUT] = 'Förfrågan tog för lång tid att processa på servern.';
    errorCodesSv[Parse.Error.USERNAME_MISSING] = 'Saknar användarnamn.';
    errorCodesSv[Parse.Error.USERNAME_TAKEN] = 'Användarnamnet är upptaget.';
    errorCodesSv[Parse.Error.VALIDATION_ERROR] = 'Server validering misslyckades.';

    // Override some login error codes with better context aware descriptions
    var loginErrorCodesSv = { };
    loginErrorCodesSv[Parse.Error.OBJECT_NOT_FOUND] = 'Felaktigt användarnamn eller lösenord.';

    var obj = { };

    /**
     * @brief Translate error object to user error description.
     */
    function mapError(error, errorLookup) {
      var errorMessage = '';
      if (error && error.code) {
        if (error.code === Parse.Error.AGGREGATE_ERROR) {
          // The error contains multiple error messages. This is typically the
          // result of a Parse.Promise.when([array]) request. In many cases all
          // the returned errors contain the same result, so get the uniqe error
          // codes and return them.
          if (!error.errors) {
            errorMessage = 'Aggregerat fel utan extra information.';
          }
          else {
            // Create map { errorCode: {Parse.Error} }
            var errorMap = _.indexBy(_.filter(error.errors, _.identity), _.property('code'));
            var errorCodes = _.keys(errorMap);

            if (errorCodes.length === 1) {
              errorMessage = obj.translateError(errorMap[errorCodes[0]]);
            }
            else {
              errorMessage = 'Multipla fel: ';
              for (var i = 0; i < errorCodes.length; i++) {
                if (i > 0) {
                  errorMessage += ', ';
                }
                errorMessage += mapError(errorMap[errorCodes[i]], errorLookup);
              }
            }
          }
        }
        else {
          errorMessage = errorLookup(error.code);
          if (!errorMessage) {
            if (error.message) {
              errorMessage = error.message + ' Error code: ' + error.code;
            }
            else {
              errorMessage = 'Okänt felmeddelande, felkod: ' + error.code + '.';
            }
          }
        }
      }
      else {
        errorMessage = 'Okänt fel utan felkod.';
      }
      return errorMessage;
    }

    obj.translateError = function(error) {
      return mapError(error, function (errorCode) {
        return errorCodesSv[errorCode];
      });
    };
    obj.translateLoginError = function(error) {
      return mapError(error, function (errorCode) {
        var errorMessage = loginErrorCodesSv[errorCode];
        if (!errorMessage) {
          errorMessage = errorCodesSv[errorCode];
        }
        return errorMessage;
      });
    };

    return obj;
  }]);
}());
