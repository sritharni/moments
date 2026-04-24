import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  searchUsers(@Query('q') q: string) {
    return this.usersService.searchUsers(q ?? '');
  }

  @Get('me')
  getMyProfile(@Request() req: { user: { sub: string } }) {
    return this.usersService.getProfileById(req.user.sub, req.user.sub);
  }

  @Get('me/follow-requests')
  getMyFollowRequests(@Request() req: { user: { sub: string } }) {
    return this.usersService.getPendingFollowRequests(req.user.sub);
  }

  @Patch('me')
  updateMyProfile(
    @Request() req: { user: { sub: string } },
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.sub, updateProfileDto);
  }

  @Post('follow-requests/:requestId/accept')
  acceptFollowRequest(
    @Request() req: { user: { sub: string } },
    @Param('requestId') requestId: string,
  ) {
    return this.usersService.acceptFollowRequest(requestId, req.user.sub);
  }

  @Post('follow-requests/:requestId/reject')
  rejectFollowRequest(
    @Request() req: { user: { sub: string } },
    @Param('requestId') requestId: string,
  ) {
    return this.usersService.rejectFollowRequest(requestId, req.user.sub);
  }

  @Get(':id')
  getUserProfile(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.usersService.getProfileById(id, req.user.sub);
  }

  @Get(':id/followers')
  getFollowers(@Param('id') id: string) {
    return this.usersService.getFollowers(id);
  }

  @Post(':id/follow')
  followUser(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.usersService.sendFollowRequest(req.user.sub, id);
  }

  @Post(':id/unfollow')
  unfollowUser(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.usersService.unfollowUser(req.user.sub, id);
  }
}
